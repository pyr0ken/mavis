use base64::Engine;
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct MediaStatus {
    pub player: String,
    pub status: String, // "Playing", "Paused", "Stopped", "None"
    pub artist: String,
    pub title: String,
    pub album: String,
    pub art_url: String,
    pub position_ms: u64,
    pub length_ms: u64,
    pub volume: f64,
    pub is_spotify: bool,
    pub available_players: Vec<String>,
}

/// Lists all active MPRIS media players via playerctl -l
pub fn list_players() -> Vec<String> {
    let output = Command::new("playerctl")
        .arg("-l")
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            stdout
                .lines()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect()
        }
        _ => Vec::new(),
    }
}

fn get_player_status(player: &str) -> String {
    let out = Command::new("playerctl")
        .arg("-p")
        .arg(player)
        .arg("status")
        .output();
    match out {
        Ok(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        _ => "Stopped".to_string(),
    }
}

pub fn is_player_spotify(player: &str) -> bool {
    let lower = player.to_lowercase();
    if lower.contains("spotify") {
        return true;
    }

    // Check if browser player is currently playing open.spotify.com
    let output = Command::new("playerctl")
        .arg("-p")
        .arg(player)
        .arg("metadata")
        .arg("--format")
        .arg("{{xesam:url}}|||{{mpris:artUrl}}|||{{xesam:title}}|||{{xesam:album}}")
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let meta = String::from_utf8_lossy(&out.stdout).to_lowercase();
            return meta.contains("spotify.com")
                || meta.contains("scdn.co")
                || meta.contains("| spotify")
                || meta.contains("- spotify")
                || meta.contains(" • ");
        }
    }

    false
}

fn is_social_media_player(url: &str, title: &str) -> bool {
    let lower_url = url.to_lowercase();
    let lower_title = title.to_lowercase();

    lower_url.contains("x.com")
        || lower_url.contains("twitter.com")
        || lower_url.contains("instagram.com")
        || lower_url.contains("tiktok.com")
        || lower_url.contains("facebook.com")
        || lower_url.contains("threads.net")
        || lower_url.contains("reddit.com")
        || lower_title.contains(" on x:")
        || lower_title.contains(" on twitter:")
        || lower_title.contains("twitter:")
}

/// Determines the best target player, prioritizing active playback, rich metadata, and Spotify.
fn resolve_target_player(player: Option<&str>, players: &[String]) -> Option<String> {
    if let Some(p) = player {
        let trimmed = p.trim();
        if !trimmed.is_empty() && players.iter().any(|pl| pl == trimmed) {
            return Some(trimmed.to_string());
        }
    }

    if players.is_empty() {
        return None;
    }

    let has_plasma = players.iter().any(|p| p.contains("plasma-browser-integration"));

    let mut scored: Vec<(i32, String)> = players
        .iter()
        .map(|p| {
            let status = get_player_status(p);
            let mut score = 0;
            if status == "Playing" {
                score += 200;
            } else if status == "Paused" {
                score += 50;
            }

            let lower = p.to_lowercase();
            if lower.contains("spotify") {
                score += 300; // Dedicated desktop client
            } else if lower.contains("plasma-browser-integration") {
                score += 80; // Rich browser extension bridge (always prefer over raw chromium)
            } else if lower.contains("chromium") {
                if has_plasma {
                    score -= 50;
                } else {
                    score += 15;
                }
            } else if lower.contains("firefox") {
                score += 20;
            }

            // Inspect metadata richness
            let output = Command::new("playerctl")
                .arg("-p")
                .arg(p)
                .arg("metadata")
                .arg("--format")
                .arg("{{artist}}|||{{title}}|||{{album}}|||{{mpris:artUrl}}|||{{xesam:url}}")
                .output();

            if let Ok(out) = output {
                if out.status.success() {
                    let meta_text = String::from_utf8_lossy(&out.stdout);
                    let parts: Vec<&str> = meta_text.split("|||").collect();
                    let artist = parts.first().unwrap_or(&"").trim();
                    let title = parts.get(1).unwrap_or(&"").trim();
                    let album = parts.get(2).unwrap_or(&"").trim();
                    let art_url = parts.get(3).unwrap_or(&"").trim();
                    let url = parts.get(4).unwrap_or(&"").trim();

                    // Instantly reject social media video clips (Twitter, X, Instagram, etc.)
                    if is_social_media_player(url, title) {
                        return (-10000, p.clone());
                    }

                    if !artist.is_empty() {
                        score += 40;
                    }
                    if !album.is_empty() {
                        score += 20;
                    }
                    if !art_url.is_empty() {
                        score += 20;
                    }
                    if url.to_lowercase().contains("spotify.com")
                        || art_url.contains("scdn.co")
                        || title.to_lowercase().contains("spotify")
                        || album.to_lowercase().contains("spotify")
                    {
                        score += 500; // Dominant priority for genuine Spotify playback!
                    }
                }
            }

            (score, p.clone())
        })
        .collect();

    scored.sort_by(|a, b| b.0.cmp(&a.0));
    if let Some((best_score, best_player)) = scored.first() {
        if *best_score > 0 {
            return Some(best_player.clone());
        }
    }
    None
}

/// Converts local file:// artwork paths to base64 data URLs so webview doesn't block them.
fn resolve_artwork_data_url(raw_url: &str) -> String {
    let trimmed = raw_url.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    if trimmed.starts_with("file://") {
        let file_path = &trimmed["file://".len()..];
        if let Ok(bytes) = std::fs::read(file_path) {
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
            let mime = if file_path.ends_with(".png") {
                "image/png"
            } else if file_path.ends_with(".jpg") || file_path.ends_with(".jpeg") {
                "image/jpeg"
            } else if file_path.ends_with(".webp") {
                "image/webp"
            } else {
                "image/png"
            };
            return format!("data:{};base64,{}", mime, b64);
        } else {
            // File does not exist or unreadable; return empty so frontend queries unblocked CDN
            return String::new();
        }
    }

    trimmed.to_string()
}

/// Normalizes titles, artists, and playlists when browser or Spotify web format titles together.
fn clean_title_and_artist(raw_title: &str, raw_artist: &str, raw_album: &str) -> (String, String, String) {
    let mut title = raw_title.trim().to_string();
    let mut artist = raw_artist.trim().to_string();
    let mut album = raw_album.trim().to_string();

    if let Some(stripped) = title.strip_suffix(" | Spotify") {
        title = stripped.trim().to_string();
    } else if let Some(stripped) = title.strip_suffix(" - Spotify") {
        title = stripped.trim().to_string();
    } else if let Some(stripped) = title.strip_suffix(" - YouTube") {
        title = stripped.trim().to_string();
    }

    if artist.is_empty() && title.contains(" • ") {
        let parts: Vec<String> = title.split(" • ").map(|s| s.to_string()).collect();
        if parts.len() == 2 {
            title = parts[0].trim().to_string();
            artist = parts[1].trim().to_string();
        }
    } else if artist.is_empty() && (title.contains(" – playlist by ") || title.contains(" - playlist by ")) {
        let sep = if title.contains(" – playlist by ") { " – playlist by " } else { " - playlist by " };
        let parts: Vec<String> = title.split(sep).map(|s| s.to_string()).collect();
        if parts.len() == 2 {
            album = parts[0].trim().to_string();
            title = parts[0].trim().to_string();
            artist = "Spotify".to_string();
        }
    } else if artist.is_empty() && title.contains(" - ") {
        let parts: Vec<String> = title.splitn(2, " - ").map(|s| s.to_string()).collect();
        if parts.len() == 2 {
            title = parts[0].trim().to_string();
            artist = parts[1].trim().to_string();
        }
    }

    (title, artist, album)
}

fn get_player_volume(player: &str) -> f64 {
    let out = Command::new("playerctl")
        .arg("-p")
        .arg(player)
        .arg("volume")
        .output();

    match out {
        Ok(o) if o.status.success() => {
            let str_val = String::from_utf8_lossy(&o.stdout).trim().to_string();
            str_val.parse::<f64>().unwrap_or(1.0).clamp(0.0, 1.0)
        }
        _ => 1.0,
    }
}

#[tauri::command]
pub fn get_media_status(player: Option<String>) -> Result<MediaStatus, String> {
    let players = list_players();
    let target = resolve_target_player(player.as_deref(), &players);

    let target_player = match target {
        Some(t) => t,
        None => {
            return Ok(MediaStatus {
                player: String::new(),
                status: "None".to_string(),
                artist: String::new(),
                title: String::new(),
                album: String::new(),
                art_url: String::new(),
                position_ms: 0,
                length_ms: 0,
                volume: 1.0,
                is_spotify: false,
                available_players: players,
            });
        }
    };

    let vol = get_player_volume(&target_player);

    // Format: {{playerName}}|||{{status}}|||{{artist}}|||{{title}}|||{{album}}|||{{mpris:artUrl}}|||{{position}}|||{{mpris:length}}
    let output = Command::new("playerctl")
        .arg("-p")
        .arg(&target_player)
        .arg("metadata")
        .arg("--format")
        .arg("{{playerName}}|||{{status}}|||{{artist}}|||{{title}}|||{{album}}|||{{mpris:artUrl}}|||{{position}}|||{{mpris:length}}|||{{xesam:url}}")
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let parts: Vec<&str> = text.split("|||").collect();

            let player_name = parts.first().map(|s| s.to_string()).unwrap_or_else(|| target_player.clone());
            let status = parts.get(1).unwrap_or(&"Unknown").to_string();
            let raw_artist = parts.get(2).unwrap_or(&"").to_string();
            let raw_title = parts.get(3).unwrap_or(&"").to_string();
            let raw_album = parts.get(4).unwrap_or(&"").to_string();
            let raw_art_url = parts.get(5).unwrap_or(&"").to_string();

            let (title, artist, album) = clean_title_and_artist(&raw_title, &raw_artist, &raw_album);
            let art_url = resolve_artwork_data_url(&raw_art_url);

            let pos_us: u64 = parts.get(6).and_then(|s| s.parse().ok()).unwrap_or(0);
            let len_us: u64 = parts.get(7).and_then(|s| s.parse().ok()).unwrap_or(0);
            let raw_url = parts.get(8).unwrap_or(&"").to_string();

            let is_spot = player_name.to_lowercase().contains("spotify")
                || target_player.to_lowercase().contains("spotify")
                || raw_art_url.contains("scdn.co")
                || raw_url.to_lowercase().contains("spotify.com")
                || title.to_lowercase().contains("spotify")
                || album.to_lowercase().contains("spotify")
                || raw_title.contains(" • ")
                || is_player_spotify(&target_player);

            Ok(MediaStatus {
                player: player_name,
                status,
                artist,
                title,
                album,
                art_url,
                position_ms: pos_us / 1000,
                length_ms: len_us / 1000,
                volume: vol,
                is_spotify: is_spot,
                available_players: players,
            })
        }
        _ => {
            let status_str = get_player_status(&target_player);
            let is_spot = target_player.to_lowercase().contains("spotify");

            Ok(MediaStatus {
                player: target_player,
                status: status_str,
                artist: String::new(),
                title: String::new(),
                album: String::new(),
                art_url: String::new(),
                position_ms: 0,
                length_ms: 0,
                volume: vol,
                is_spotify: is_spot,
                available_players: players,
            })
        }
    }
}

#[tauri::command]
pub fn send_media_command(command: String, player: Option<String>) -> Result<MediaStatus, String> {
    let players = list_players();
    let target = resolve_target_player(player.as_deref(), &players)
        .unwrap_or_else(|| "spotify".to_string());

    let cmd_trimmed = command.trim();
    let mut args = vec!["-p", target.as_str()];
    let split_args: Vec<&str> = cmd_trimmed.split_whitespace().collect();

    match split_args.first().copied() {
        Some("play-pause") | Some("toggle") => {
            args.push("play-pause");
        }
        Some("play") => {
            args.push("play");
        }
        Some("pause") => {
            args.push("pause");
        }
        Some("next") => {
            args.push("next");
        }
        Some("previous") | Some("prev") => {
            args.push("previous");
        }
        Some("stop") => {
            args.push("stop");
        }
        Some("position") => {
            args.push("position");
            if let Some(pos) = split_args.get(1) {
                args.push(pos);
            }
        }
        Some("volume") => {
            args.push("volume");
            if let Some(vol) = split_args.get(1) {
                args.push(vol);
            }
        }
        _ => {
            args.push("play-pause");
        }
    }

    let _ = Command::new("playerctl")
        .args(&args)
        .output();

    std::thread::sleep(std::time::Duration::from_millis(60));

    get_media_status(Some(target))
}

#[tauri::command]
pub fn launch_spotify() -> Result<bool, String> {
    let check_cmd = Command::new("which").arg("spotify").output();
    let has_spotify = check_cmd.map(|o| o.status.success()).unwrap_or(false);

    if has_spotify {
        let _ = Command::new("spotify").spawn();
        return Ok(true);
    }

    let check_launcher = Command::new("which").arg("spotify-launcher").output();
    let has_launcher = check_launcher.map(|o| o.status.success()).unwrap_or(false);

    if has_launcher {
        let _ = Command::new("spotify-launcher").spawn();
        return Ok(true);
    }

    let check_flatpak = Command::new("flatpak").args(["info", "com.spotify.Client"]).output();
    let has_flatpak = check_flatpak.map(|o| o.status.success()).unwrap_or(false);

    if has_flatpak {
        let _ = Command::new("flatpak").args(["run", "com.spotify.Client"]).spawn();
        return Ok(true);
    }

    let _ = Command::new("xdg-open")
        .arg("https://open.spotify.com")
        .spawn();

    Ok(true)
}

static CAVA_CHILD: Mutex<Option<Child>> = Mutex::new(None);
static CAVA_ACTIVE: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub fn start_audio_visualizer(app: AppHandle, bars: Option<u32>) -> Result<bool, String> {
    if CAVA_ACTIVE.load(Ordering::SeqCst) {
        return Ok(true);
    }

    let which_cava = Command::new("which").arg("cava").output();
    let has_cava = which_cava.map(|o| o.status.success()).unwrap_or(false);
    if !has_cava {
        return Ok(false);
    }

    let bar_count = bars.unwrap_or(36).clamp(16, 64);
    let conf_path = std::env::temp_dir().join("mavis_cava.conf");
    let conf_content = format!(
"[general]\nbars = {}\nframerate = 30\nautosens = 1\n[input]\nmethod = pulse\nsource = auto\n[output]\nmethod = raw\nraw_target = /dev/stdout\ndata_format = ascii\nascii_max_range = 100\nbar_delimiter = 59\n",
        bar_count
    );

    if let Err(e) = std::fs::write(&conf_path, conf_content) {
        return Err(format!("Failed to write cava config: {}", e));
    }

    let child = Command::new("cava")
        .arg("-p")
        .arg(&conf_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn();

    match child {
        Ok(mut proc) => {
            let stdout = match proc.stdout.take() {
                Some(s) => s,
                None => return Err("Failed to capture cava stdout".to_string()),
            };

            {
                let mut lock = CAVA_CHILD.lock().unwrap();
                *lock = Some(proc);
            }
            CAVA_ACTIVE.store(true, Ordering::SeqCst);

            let app_handle = app.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    if !CAVA_ACTIVE.load(Ordering::SeqCst) {
                        break;
                    }
                    if let Ok(l) = line {
                        let l_trimmed = l.trim();
                        if l_trimmed.is_empty() {
                            continue;
                        }
                        let bars: Vec<f32> = l_trimmed
                            .split(';')
                            .filter_map(|val| val.parse::<f32>().ok())
                            .map(|v| (v / 100.0).clamp(0.0, 1.0))
                            .collect();

                        if !bars.is_empty() {
                            let _ = app_handle.emit("cava_bars", bars);
                        }
                    }
                }

                CAVA_ACTIVE.store(false, Ordering::SeqCst);
                let mut lock = CAVA_CHILD.lock().unwrap();
                if let Some(mut child) = lock.take() {
                    let _ = child.kill();
                }
            });

            Ok(true)
        }
        Err(e) => Err(format!("Failed to spawn cava: {}", e)),
    }
}

#[tauri::command]
pub fn stop_audio_visualizer() -> Result<(), String> {
    CAVA_ACTIVE.store(false, Ordering::SeqCst);
    let mut lock = CAVA_CHILD.lock().unwrap();
    if let Some(mut child) = lock.take() {
        let _ = child.kill();
    }
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, Default)]
pub struct LyricsPayload {
    pub title: String,
    pub artist: String,
    pub synced_lyrics: Option<String>,
    pub plain_lyrics: Option<String>,
    pub live_active_line: Option<String>,
    pub live_prev_line: Option<String>,
    pub live_next_line: Option<String>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug, Default)]
pub struct SpotifyRawLine {
    #[serde(rename = "startTimeMs")]
    pub start_time_ms: Option<String>,
    pub words: Option<String>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug, Default)]
pub struct SpotifyRawLyrics {
    #[serde(rename = "syncType")]
    pub sync_type: Option<String>,
    pub lines: Option<Vec<SpotifyRawLine>>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug, Default)]
pub struct InboundPayload {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub synced_lyrics: Option<String>,
    pub plain_lyrics: Option<String>,
    pub lyrics: Option<SpotifyRawLyrics>,
    pub live_active_line: Option<String>,
    pub live_prev_line: Option<String>,
    pub live_next_line: Option<String>,
}

static SPOTIFY_SESSION_LYRICS: Mutex<Option<LyricsPayload>> = Mutex::new(None);

pub fn start_lyrics_server(app: AppHandle) {
    std::thread::spawn(move || {
        let listener = match std::net::TcpListener::bind("127.0.0.1:20261") {
            Ok(l) => {
                eprintln!("[lyrics_server] Chrome Live Lyrics Bridge listening on http://127.0.0.1:20261/lyrics");
                l
            }
            Err(e) => {
                eprintln!("[lyrics_server] Warning: Could not bind 127.0.0.1:20261: {}", e);
                return;
            }
        };

        for stream in listener.incoming() {
            if let Ok(mut stream) = stream {
                let app_handle = app.clone();
                std::thread::spawn(move || {
                    handle_lyrics_http(&mut stream, &app_handle);
                });
            }
        }
    });
}

fn handle_lyrics_http(stream: &mut std::net::TcpStream, app: &AppHandle) {
    use std::io::{Read, Write};
    let mut initial_buf = [0u8; 4096];
    let n = match stream.read(&mut initial_buf) {
        Ok(n) if n > 0 => n,
        _ => return,
    };

    let mut data = initial_buf[..n].to_vec();

    // Parse Content-Length from headers
    let header_end = data.windows(4).position(|w| w == b"\r\n\r\n");
    let (header_bytes_len, content_len) = if let Some(pos) = header_end {
        let headers_str = String::from_utf8_lossy(&data[..pos]);
        let mut cl = 0usize;
        for line in headers_str.lines() {
            if line.to_lowercase().starts_with("content-length:") {
                if let Some(val) = line.split(':').nth(1) {
                    cl = val.trim().parse::<usize>().unwrap_or(0);
                }
            }
        }
        (pos + 4, cl)
    } else {
        (n, 0)
    };

    // Ensure complete body is buffered
    let needed = header_bytes_len + content_len;
    while data.len() < needed {
        let mut chunk = [0u8; 4096];
        match stream.read(&mut chunk) {
            Ok(cn) if cn > 0 => {
                data.extend_from_slice(&chunk[..cn]);
            }
            _ => break,
        }
    }

    let req_str = String::from_utf8_lossy(&data);
    let first_line = req_str.lines().next().unwrap_or("");
    let is_options = first_line.starts_with("OPTIONS");
    let is_post = first_line.starts_with("POST");

    let cors_headers = "Access-Control-Allow-Origin: *\r\n\
                        Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n\
                        Access-Control-Allow-Headers: Content-Type, Authorization\r\n\
                        Access-Control-Allow-Private-Network: true\r\n";

    if is_options {
        let resp = format!(
            "HTTP/1.1 200 OK\r\n{}Content-Length: 0\r\nConnection: close\r\n\r\n",
            cors_headers
        );
        let _ = stream.write_all(resp.as_bytes());
        return;
    }

    if is_post {
        let body = if header_bytes_len <= data.len() {
            &data[header_bytes_len..]
        } else {
            &[]
        };

        if let Ok(inbound) = serde_json::from_slice::<InboundPayload>(body) {
            let mut final_synced = inbound.synced_lyrics.clone();
            let mut final_plain = inbound.plain_lyrics.clone();
            let mut live_active = inbound.live_active_line.clone();
            let mut live_prev = inbound.live_prev_line.clone();
            let mut live_next = inbound.live_next_line.clone();

            // Format raw Spotify color-lyrics JSON to standard LRC
            if let Some(raw_lyrics) = inbound.lyrics {
                if let Some(lines) = raw_lyrics.lines {
                    let mut lrc_buf = String::new();
                    let mut plain_buf = String::new();
                    for line in lines {
                        let words = line.words.unwrap_or_default();
                        if !words.trim().is_empty() {
                            plain_buf.push_str(&words);
                            plain_buf.push('\n');
                        }

                        if let Some(ms_str) = line.start_time_ms {
                            if let Ok(ms) = ms_str.parse::<u64>() {
                                let m = ms / 60000;
                                let s = (ms % 60000) / 1000;
                                let cs = (ms % 1000) / 10;
                                lrc_buf.push_str(&format!("[{:02}:{:02}.{:02}] {}\n", m, s, cs, words));
                            }
                        }
                    }
                    if !lrc_buf.is_empty() {
                        final_synced = Some(lrc_buf);
                    }
                    if !plain_buf.is_empty() {
                        final_plain = Some(plain_buf);
                    }
                }
            }

            // Carry over existing synced_lyrics ONLY if this incoming ping is for the SAME track
            {
                let lock = SPOTIFY_SESSION_LYRICS.lock().unwrap();
                if let Some(existing) = &*lock {
                    let inbound_title = inbound.title.as_deref().unwrap_or("").trim().to_lowercase();
                    let existing_title = existing.title.trim().to_lowercase();
                    let is_same = !inbound_title.is_empty() && (inbound_title == existing_title || inbound_title.contains(&existing_title) || existing_title.contains(&inbound_title));

                    if is_same {
                        if final_synced.is_none() && existing.synced_lyrics.is_some() {
                            final_synced = existing.synced_lyrics.clone();
                        }
                        if final_plain.is_none() && existing.plain_lyrics.is_some() {
                            final_plain = existing.plain_lyrics.clone();
                        }
                        if live_active.is_none() {
                            live_active = existing.live_active_line.clone();
                            live_prev = existing.live_prev_line.clone();
                            live_next = existing.live_next_line.clone();
                        }
                    }
                }
            }

            let payload = LyricsPayload {
                title: inbound.title.unwrap_or_default(),
                artist: inbound.artist.unwrap_or_default(),
                synced_lyrics: final_synced,
                plain_lyrics: final_plain,
                live_active_line: live_active,
                live_prev_line: live_prev,
                live_next_line: live_next,
            };

            eprintln!(
                "[lyrics_server] Ingested lyrics directly from Chrome Spotify tab for: '{}' by '{}' (lines: {})",
                payload.title,
                payload.artist,
                payload.synced_lyrics.as_ref().map(|s| s.lines().count()).unwrap_or(0)
            );

            {
                let mut lock = SPOTIFY_SESSION_LYRICS.lock().unwrap();
                *lock = Some(payload.clone());
            }

            let _ = app.emit("spotify_lyrics_update", payload);

            let resp = format!(
                "HTTP/1.1 200 OK\r\n{}Content-Type: application/json\r\nConnection: close\r\n\r\n{{\"status\":\"ok\"}}",
                cors_headers
            );
            let _ = stream.write_all(resp.as_bytes());
            return;
        }

        let resp = format!(
            "HTTP/1.1 400 Bad Request\r\n{}Content-Type: application/json\r\nConnection: close\r\n\r\n{{\"error\":\"invalid_payload\"}}",
            cors_headers
        );
        let _ = stream.write_all(resp.as_bytes());
        return;
    }

    // Default GET response
    let lock = SPOTIFY_SESSION_LYRICS.lock().unwrap();
    let body = serde_json::to_string(&*lock).unwrap_or_else(|_| "null".to_string());
    let resp = format!(
        "HTTP/1.1 200 OK\r\n{}Content-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        cors_headers,
        body.len(),
        body
    );
    let _ = stream.write_all(resp.as_bytes());
}

#[tauri::command]
pub async fn fetch_lyrics(
    title: String,
    artist: String,
) -> Result<LyricsPayload, String> {
    let clean_title = title
        .split('(').next().unwrap_or(&title)
        .split('[').next().unwrap_or(&title)
        .replace(" - Single", "")
        .replace(" - Remastered", "")
        .trim()
        .to_string();

    let clean_artist = artist
        .split('(').next().unwrap_or(&artist)
        .split('[').next().unwrap_or(&artist)
        .split(',').next().unwrap_or(&artist)
        .split('&').next().unwrap_or(&artist)
        .trim()
        .to_string();

    eprintln!("[lyrics] Fetching verified synced lyrics for '{}' by '{}'", clean_title, clean_artist);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    // 1. Direct query by exact title & artist
    if let Ok(res) = client
        .get("https://lrclib.net/api/get")
        .query(&[("artist_name", clean_artist.as_str()), ("track_name", clean_title.as_str())])
        .send()
        .await
    {
        if res.status().is_success() {
            if let Ok(json) = res.json::<serde_json::Value>().await {
                if let Some(synced) = json.get("syncedLyrics").and_then(|v| v.as_str()) {
                    if !synced.trim().is_empty() {
                        return Ok(LyricsPayload {
                            title,
                            artist,
                            synced_lyrics: Some(synced.to_string()),
                            plain_lyrics: json.get("plainLyrics").and_then(|v| v.as_str()).map(|s| s.to_string()),
                            live_active_line: None,
                            live_prev_line: None,
                            live_next_line: None,
                        });
                    }
                }
            }
        }
    }

    // 2. Search query fallback
    let search_q = format!("{} {}", clean_title, clean_artist);
    if let Ok(res) = client
        .get("https://lrclib.net/api/search")
        .query(&[("q", &search_q)])
        .send()
        .await
    {
        if res.status().is_success() {
            if let Ok(list) = res.json::<Vec<serde_json::Value>>().await {
                for item in list {
                    if let Some(synced) = item.get("syncedLyrics").and_then(|v| v.as_str()) {
                        if !synced.trim().is_empty() {
                            return Ok(LyricsPayload {
                                title,
                                artist,
                                synced_lyrics: Some(synced.to_string()),
                                plain_lyrics: item.get("plainLyrics").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                live_active_line: None,
                                live_prev_line: None,
                                live_next_line: None,
                            });
                        }
                    }
                }
            }
        }
    }

    Ok(LyricsPayload {
        title,
        artist,
        synced_lyrics: None,
        plain_lyrics: None,
        live_active_line: None,
        live_prev_line: None,
        live_next_line: None,
    })
}
