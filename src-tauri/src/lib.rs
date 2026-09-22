use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, LogicalPosition, LogicalSize, Manager, WebviewWindow};

#[cfg(target_os = "linux")]
use gtk::prelude::*;

#[cfg(target_os = "linux")]
mod layer_shell {
    use gtk::prelude::*;

    #[repr(C)]
    #[allow(dead_code)]
    pub enum GtkLayerShellLayer {
        Background = 0,
        Bottom = 1,
        Top = 2,
        Overlay = 3,
    }

    #[repr(C)]
    #[allow(dead_code)]
    pub enum GtkLayerShellEdge {
        Left = 0,
        Right = 1,
        Top = 2,
        Bottom = 3,
    }

    #[repr(C)]
    #[allow(dead_code)]
    pub enum GtkLayerShellKeyboardMode {
        None = 0,
        Exclusive = 1,
        OnDemand = 2,
    }

    #[link(name = "gtk-layer-shell")]
    extern "C" {
        pub fn gtk_layer_is_supported() -> gtk::glib::ffi::gboolean;
        pub fn gtk_layer_init_for_window(window: *mut gtk::ffi::GtkWindow);
        pub fn gtk_layer_set_namespace(window: *mut gtk::ffi::GtkWindow, name_space: *const std::os::raw::c_char);
        pub fn gtk_layer_set_layer(window: *mut gtk::ffi::GtkWindow, layer: GtkLayerShellLayer);
        pub fn gtk_layer_set_anchor(window: *mut gtk::ffi::GtkWindow, edge: GtkLayerShellEdge, anchor_to_edge: gtk::glib::ffi::gboolean);
        pub fn gtk_layer_set_margin(window: *mut gtk::ffi::GtkWindow, edge: GtkLayerShellEdge, margin_size: i32);
        pub fn gtk_layer_set_keyboard_mode(window: *mut gtk::ffi::GtkWindow, mode: GtkLayerShellKeyboardMode);
        pub fn gtk_layer_set_exclusive_zone(window: *mut gtk::ffi::GtkWindow, exclusive_zone: i32);
    }

    pub fn apply_layer_shell(gtk_win: &gtk::ApplicationWindow) -> bool {
        unsafe {
            if gtk_layer_is_supported() != 0 {
                let win_ptr = gtk_win.as_ptr() as *mut gtk::ffi::GtkWindow;
                gtk_layer_init_for_window(win_ptr);
                gtk_layer_set_namespace(win_ptr, b"mavis\0".as_ptr() as *const _);
                // Set to Layer::Top (same layer as KRunner and Plasma panels), so that screenshot tools
                // like Spectacle (which operate on Overlay) can smoothly capture and select it.
                gtk_layer_set_layer(win_ptr, GtkLayerShellLayer::Top);
                gtk_layer_set_anchor(win_ptr, GtkLayerShellEdge::Top, 1);
                gtk_layer_set_anchor(win_ptr, GtkLayerShellEdge::Left, 0);
                gtk_layer_set_anchor(win_ptr, GtkLayerShellEdge::Right, 0);
                gtk_layer_set_anchor(win_ptr, GtkLayerShellEdge::Bottom, 0);
                gtk_layer_set_margin(win_ptr, GtkLayerShellEdge::Top, 0);
                gtk_layer_set_exclusive_zone(win_ptr, 0);
                gtk_layer_set_keyboard_mode(win_ptr, GtkLayerShellKeyboardMode::Exclusive);
                return true;
            }
        }
        false
    }

    pub fn set_keyboard_mode_interactive(gtk_win: &gtk::ApplicationWindow, interactive: bool) {
        unsafe {
            if gtk_layer_is_supported() != 0 {
                let win_ptr = gtk_win.as_ptr() as *mut gtk::ffi::GtkWindow;
                let mode = if interactive {
                    GtkLayerShellKeyboardMode::Exclusive
                } else {
                    GtkLayerShellKeyboardMode::None
                };
                gtk_layer_set_keyboard_mode(win_ptr, mode);
            }
        }
    }
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct ChatMessagePayload {
    pub role: String,
    pub content: String,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct ChatTokenEvent {
    pub message_id: String,
    pub token: String,
    pub is_done: bool,
    pub error: Option<String>,
}

#[tauri::command]
async fn send_chat_stream(
    window: WebviewWindow,
    message_id: String,
    messages: Vec<ChatMessagePayload>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let payload = serde_json::json!({
        "model": "antigravity",
        "messages": messages,
        "stream": true
    });

    let res = client
        .post("http://127.0.0.1:20128/v1/chat/completions")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_else(|_| "OmniRoute request failed".to_string());
        let _ = window.emit(
            "chat-stream-event",
            ChatTokenEvent {
                message_id: message_id.clone(),
                token: "".to_string(),
                is_done: true,
                error: Some(err_text),
            },
        );
        return Err("OmniRoute returned error status".to_string());
    }

    let mut stream = res.bytes_stream();
    let mut buffer = String::new();

    use futures_util::StreamExt;
    while let Some(chunk_res) = stream.next().await {
        match chunk_res {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes);
                buffer.push_str(&text);

                while let Some(pos) = buffer.find('\n') {
                    let line = buffer[..pos].trim().to_string();
                    buffer = buffer[pos + 1..].to_string();

                    if line.starts_with("data: ") {
                        let data = &line[6..];
                        if data == "[DONE]" {
                            let _ = window.emit(
                                "chat-stream-event",
                                ChatTokenEvent {
                                    message_id: message_id.clone(),
                                    token: "".to_string(),
                                    is_done: true,
                                    error: None,
                                },
                            );
                            return Ok(());
                        }

                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(data) {
                            if let Some(delta) = val
                                .get("choices")
                                .and_then(|c| c.get(0))
                                .and_then(|c0| c0.get("delta"))
                                .and_then(|d| d.get("content"))
                                .and_then(|cnt| cnt.as_str())
                            {
                                let _ = window.emit(
                                    "chat-stream-event",
                                    ChatTokenEvent {
                                        message_id: message_id.clone(),
                                        token: delta.to_string(),
                                        is_done: false,
                                        error: None,
                                    },
                                );
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let _ = window.emit(
                    "chat-stream-event",
                    ChatTokenEvent {
                        message_id: message_id.clone(),
                        token: "".to_string(),
                        is_done: true,
                        error: Some(e.to_string()),
                    },
                );
                return Err(e.to_string());
            }
        }
    }

    let _ = window.emit(
        "chat-stream-event",
        ChatTokenEvent {
            message_id,
            token: "".to_string(),
            is_done: true,
            error: None,
        },
    );

    Ok(())
}

#[tauri::command]
fn update_input_region(window: WebviewWindow, width: i32, height: i32) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let win = window.clone();
        gtk::glib::idle_add_once(move || {
            if let Ok(gtk_win) = win.gtk_window() {
                if let Some(gdk_win) = gtk_win.window() {
                    if width <= 0 || height <= 0 {
                        let empty = cairo::Region::create();
                        gdk_win.input_shape_combine_region(&empty, 0, 0);
                    } else {
                        let window_width = 1100;
                        let x = (window_width - width) / 2;
                        let y = 0;
                        let rect = cairo::RectangleInt::new(x, y, width, height);
                        let region = cairo::Region::create_rectangle(&rect);
                        gdk_win.input_shape_combine_region(&region, 0, 0);
                    }
                }
            }
        });
    }
    Ok(())
}

#[tauri::command]
fn center_top_window(window: WebviewWindow) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let scale_factor = monitor.scale_factor();
        let monitor_size = monitor.size().to_logical::<f64>(scale_factor);
        let monitor_pos = monitor.position().to_logical::<f64>(scale_factor);
        let window_width = 1100.0;
        let window_height = 720.0;

        let x = monitor_pos.x + (monitor_size.width - window_width) / 2.0;
        let y = monitor_pos.y;

        let _ = window.set_size(LogicalSize::new(window_width, window_height));
        let _ = window.set_position(LogicalPosition::new(x, y));
        let _ = window.set_always_on_top(true);
        let _ = window.set_visible_on_all_workspaces(true);
        let _ = window.set_skip_taskbar(true);
    }
    Ok(())
}

#[tauri::command]
fn show_window(window: WebviewWindow) -> Result<(), String> {
    let win = window.clone();
    #[cfg(target_os = "linux")]
    {
        gtk::glib::idle_add_once(move || {
            let _ = center_top_window(win.clone());
            let _ = win.show();
            let _ = win.set_focus();
            let _ = win.set_always_on_top(true);
            let _ = win.set_visible_on_all_workspaces(true);
            let _ = win.set_skip_taskbar(true);
            let _ = update_input_region(win.clone(), 500, 80);

            if let Ok(gtk_win) = win.gtk_window() {
                layer_shell::set_keyboard_mode_interactive(&gtk_win, true);
                gtk_win.set_type_hint(gdk::WindowTypeHint::Dock);
                gtk_win.set_skip_taskbar_hint(true);
                gtk_win.set_skip_pager_hint(true);
                gtk_win.set_keep_above(true);
                gtk_win.stick();
                gtk_win.present();
                gtk_win.grab_focus();
            }
        });
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = center_top_window(window.clone());
        let _ = window.show();
        let _ = window.set_focus();
    }

    Ok(())
}

#[tauri::command]
fn hide_window(window: WebviewWindow) -> Result<(), String> {
    let win = window.clone();
    #[cfg(target_os = "linux")]
    {
        gtk::glib::idle_add_once(move || {
            if let Ok(gtk_win) = win.gtk_window() {
                layer_shell::set_keyboard_mode_interactive(&gtk_win, false);
            }
            let _ = update_input_region(win.clone(), 0, 0);
            let _ = win.hide();
        });
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = update_input_region(window.clone(), 0, 0);
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
fn set_keyboard_interactivity(window: WebviewWindow, interactive: bool) -> Result<(), String> {
    let win = window.clone();
    #[cfg(target_os = "linux")]
    {
        gtk::glib::idle_add_once(move || {
            if let Ok(gtk_win) = win.gtk_window() {
                layer_shell::set_keyboard_mode_interactive(&gtk_win, interactive);
                if interactive {
                    gtk_win.present();
                    gtk_win.grab_focus();
                    let _ = win.set_focus();
                }
            }
        });
    }
    Ok(())
}

#[tauri::command]
fn set_cursor_click_through(window: WebviewWindow, ignore: bool) -> Result<(), String> {
    if ignore {
        let _ = update_input_region(window.clone(), 0, 0);
    } else {
        let _ = update_input_region(window.clone(), 400, 70);
    }
    Ok(())
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub fn run() {
    #[cfg(target_os = "linux")]
    {
        gtk::glib::set_prgname(Some("mavis"));
        gtk::glib::set_application_name("mavis");
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            center_top_window,
            show_window,
            hide_window,
            set_cursor_click_through,
            update_input_region,
            set_keyboard_interactivity,
            send_chat_stream
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // Prepare window position and apply native Wayland Layer Shell (or X11 Dock fallback)
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "linux")]
                {
                    if let Ok(gtk_win) = window.gtk_window() {
                        let is_layer_shell = layer_shell::apply_layer_shell(&gtk_win);
                        if !is_layer_shell {
                            gtk_win.set_type_hint(gdk::WindowTypeHint::Dock);
                            gtk_win.set_skip_taskbar_hint(true);
                            gtk_win.set_skip_pager_hint(true);
                            gtk_win.set_keep_above(true);
                            gtk_win.stick();
                            gtk_win.set_decorated(false);
                            gtk_win.set_role("mavis");
                        }

                        // When mapped, set initial input region to only the compact top notch (400x70)
                        let win_handle = window.clone();
                        gtk_win.connect_map(move |_| {
                            let _ = update_input_region(win_handle.clone(), 400, 70);
                        });
                    }
                }

                let _ = center_top_window(window.clone());
                let _ = window.set_always_on_top(true);
                let _ = window.set_visible_on_all_workspaces(true);
                let _ = window.set_skip_taskbar(true);
                let _ = window.show();
            }

            // Spawn global background keyhook listener for Ctrl + Alt with strict press latch
            let ctrl_held = Arc::new(AtomicBool::new(false));
            let alt_held = Arc::new(AtomicBool::new(false));
            let triggered_latch = Arc::new(AtomicBool::new(false));
            let last_trigger = Arc::new(AtomicU64::new(0));

            std::thread::spawn(move || {
                use rdev::{Event, EventType, Key};

                let callback = move |event: Event| {
                    match event.event_type {
                        EventType::KeyPress(key) => {
                            match key {
                                Key::ControlLeft | Key::ControlRight => {
                                    ctrl_held.store(true, Ordering::SeqCst);
                                }
                                Key::Alt | Key::AltGr => {
                                    alt_held.store(true, Ordering::SeqCst);
                                }
                                _ => {}
                            }

                            // Trigger ONLY once when both keys are held and latch is unlatched
                            let is_both = ctrl_held.load(Ordering::SeqCst) && alt_held.load(Ordering::SeqCst);
                            if is_both && !triggered_latch.load(Ordering::SeqCst) {
                                let now = now_millis();
                                let last = last_trigger.load(Ordering::SeqCst);

                                if now - last > 160 {
                                    triggered_latch.store(true, Ordering::SeqCst);
                                    last_trigger.store(now, Ordering::SeqCst);

                                    if let Some(window) = handle.get_webview_window("main") {
                                        #[cfg(target_os = "linux")]
                                        {
                                            let win = window.clone();
                                            gtk::glib::idle_add_once(move || {
                                                if let Ok(gtk_win) = win.gtk_window() {
                                                    layer_shell::set_keyboard_mode_interactive(&gtk_win, true);
                                                    gtk_win.present();
                                                }
                                                let _ = win.set_focus();
                                                let _ = win.emit("global-shortcut-triggered", ());
                                            });
                                        }
                                        #[cfg(not(target_os = "linux"))]
                                        {
                                            let _ = window.set_focus();
                                            let _ = window.emit("global-shortcut-triggered", ());
                                        }
                                    }
                                }
                            }
                        }
                        EventType::KeyRelease(key) => {
                            match key {
                                Key::ControlLeft | Key::ControlRight => {
                                    ctrl_held.store(false, Ordering::SeqCst);
                                }
                                Key::Alt | Key::AltGr => {
                                    alt_held.store(false, Ordering::SeqCst);
                                }
                                _ => {}
                            }

                            // When at least one key is released, release the latch so next press can trigger cleanly
                            let is_both = ctrl_held.load(Ordering::SeqCst) && alt_held.load(Ordering::SeqCst);
                            if !is_both {
                                triggered_latch.store(false, Ordering::SeqCst);
                            }
                        }
                        _ => {}
                    }
                };

                if let Err(error) = rdev::listen(callback) {
                    eprintln!("Global keyhook error: {:?}", error);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running voice island tauri application");
}
