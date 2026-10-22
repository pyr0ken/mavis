// ==UserScript==
// @name         Mavis Spotify Live Lyrics Bridge
// @namespace    https://github.com/mavis
// @version      1.0.4
// @description  Pure 1:1 Live DOM & Audio Mirror from open.spotify.com to Mavis Dynamic Island (http://127.0.0.1:20261/lyrics)
// @author       Antigravity / Mavis
// @match        https://open.spotify.com/*
// @grant        GM_xmlhttpRequest
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  console.log('[Mavis Bridge] Active v1.0.4 - Live Spotify DOM & Audio Sync');

  const MAVIS_ENDPOINT = 'http://127.0.0.1:20261/lyrics';
  let lastTrackId = '';
  let cachedToken = '';
  let activeLyricsList = [];
  let lastSentLine = '';

  // Send payload to local Mavis server
  function postToMavis(payload) {
    const bodyStr = JSON.stringify(payload);

    if (typeof GM_xmlhttpRequest !== 'undefined') {
      try {
        GM_xmlhttpRequest({
          method: 'POST',
          url: MAVIS_ENDPOINT,
          headers: { 'Content-Type': 'application/json' },
          data: bodyStr,
          onload: () => {},
          onerror: (err) => console.warn('[Mavis Bridge] Post error:', err),
        });
        return;
      } catch (e) {}
    }

    fetch(MAVIS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
      mode: 'cors',
    }).catch(() => {});
  }

  // 1. Get WebPlayer Access Token
  async function fetchToken() {
    try {
      const res = await fetch('/get_access_token?reason=transport&productType=web_player');
      if (res.ok) {
        const data = await res.json();
        if (data && data.accessToken) {
          cachedToken = 'Bearer ' + data.accessToken;
          console.log('[Mavis Bridge] Access token ready!');
        }
      }
    } catch (e) {}
  }
  fetchToken();
  setInterval(fetchToken, 10 * 60 * 1000);

  // 2. Read current track directly from bottom now-playing bar
  function getCurrentTrack() {
    try {
      const bar =
        document.querySelector('[data-testid="now-playing-bar"]') ||
        document.querySelector('footer');

      if (!bar) return null;

      const trackLink = bar.querySelector('a[href*="/track/"]');
      const match = (trackLink?.href || '').match(/\/track\/([a-zA-Z0-9]+)/);
      const trackId = match ? match[1] : '';

      const titleEl =
        bar.querySelector('[data-testid="context-item-info-title"]') ||
        bar.querySelector('[data-testid="context-item-link"]') ||
        trackLink;
      const title = titleEl?.textContent?.trim() || navigator.mediaSession?.metadata?.title || '';

      const artistEl =
        bar.querySelector('[data-testid="context-item-info-artist"]') ||
        bar.querySelector('[data-testid="context-item-info-subtitles"]');
      const artist = artistEl?.textContent?.trim() || navigator.mediaSession?.metadata?.artist || '';

      if (!trackId && !title) return null;
      return { trackId, title, artist };
    } catch (e) {
      return null;
    }
  }

  // 3. Fetch Color-Lyrics for current active track
  async function loadLyrics(trackId, title, artist) {
    if (!trackId || trackId === lastTrackId) return;

    if (!cachedToken) await fetchToken();
    if (!cachedToken) return;

    try {
      const apiUrl = 'https://spclient.wg.spotify.com/color-lyrics/v2/track/' + trackId + '?format=json&vocalRemoval=false&market=from_token';
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: cachedToken,
          'app-platform': 'WebPlayer',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.lyrics && data.lyrics.lines) {
          const cur = getCurrentTrack();
          if (cur && cur.trackId && cur.trackId !== trackId) return; // Discard if track already changed

          lastTrackId = trackId;
          activeLyricsList = data.lyrics.lines;
          console.log('[Mavis Bridge] Loaded ' + activeLyricsList.length + ' lines for: ' + title);

          postToMavis({
            title: title || '',
            artist: artist || '',
            lyrics: data.lyrics,
          });
        }
      }
    } catch (e) {
      console.warn('[Mavis Bridge] loadLyrics error:', e);
    }
  }

  // 4. Intercept network color-lyrics calls
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // Capture token if seen
    try {
      const h = args[1]?.headers;
      const auth = (h instanceof Headers ? h.get('Authorization') : h?.Authorization || h?.authorization) || '';
      if (auth.startsWith('Bearer ')) cachedToken = auth;
    } catch (e) {}

    const res = await origFetch.apply(this, args);

    if (url.includes('color-lyrics/v2/track/')) {
      try {
        const match = url.match(/track\/([a-zA-Z0-9]+)/);
        const fetchedId = match ? match[1] : '';
        const cur = getCurrentTrack();
        if (cur && cur.trackId && fetchedId !== cur.trackId) {
          return res; // Ignore prefetches for next songs!
        }
        res.clone().json().then((data) => {
          if (data?.lyrics?.lines) {
            const now = getCurrentTrack();
            lastTrackId = fetchedId;
            activeLyricsList = data.lyrics.lines;
            postToMavis({
              title: now ? now.title : '',
              artist: now ? now.artist : '',
              lyrics: data.lyrics,
            });
          }
        }).catch(() => {});
      } catch (e) {}
    }

    return res;
  };

  // 5. PURE 1:1 REAL-TIME MIRROR: Check which line is singing RIGHT NOW
  function tickMirror() {
    const cur = getCurrentTrack();
    if (!cur || !cur.title) return;

    let active = '';
    let prev = '';
    let next = '';

    // A. Check DOM elements (if lyrics view or sidebar is open in Spotify)
    const domEls = Array.from(
      document.querySelectorAll(
        '[data-testid="fullscreen-lyric"], [data-testid="lyrics-line"], [data-testid="now-playing-panel"] div[dir="auto"], [data-testid="lyrics-container"] div[dir="auto"]'
      )
    ).filter((el) => el.textContent && el.textContent.trim().length > 0);

    if (domEls.length > 0) {
      for (let i = 0; i < domEls.length; i++) {
        const el = domEls[i];
        const cl = el.className || '';
        const st = window.getComputedStyle(el);
        const color = st.color || '';
        const op = parseFloat(st.opacity || '1');

        // Spotify highlights the active line with bright white text and full opacity
        if (
          cl.includes('active') ||
          el.getAttribute('aria-current') === 'true' ||
          (op >= 0.95 && (color.includes('255, 255, 255') || color === 'white' || st.fontWeight === '700'))
        ) {
          active = el.textContent.trim();
          prev = domEls[i - 1]?.textContent?.trim() || '';
          next = domEls[i + 1]?.textContent?.trim() || '';
          break;
        }
      }
    }

    // B. Acoustic Sync: Use HTML audio element / playback position
    if (!active && activeLyricsList.length > 0) {
      // Find current millisecond from audio element or playback bar
      let curMs = 0;
      const audio = document.querySelector('audio');
      if (audio && !audio.paused && audio.currentTime > 0) {
        curMs = Math.round(audio.currentTime * 1000);
      } else {
        // Read "0:24" from [data-testid="playback-position"]
        const posText = document.querySelector('[data-testid="playback-position"]')?.textContent?.trim() || '';
        if (posText && posText.includes(':')) {
          const parts = posText.split(':');
          const min = parseInt(parts[0], 10) || 0;
          const sec = parseInt(parts[1], 10) || 0;
          curMs = (min * 60 + sec) * 1000;
        }
      }

      if (curMs > 0) {
        let idx = 0;
        for (let i = 0; i < activeLyricsList.length; i++) {
          const lMs = parseInt(activeLyricsList[i].startTimeMs, 10);
          if (curMs >= lMs) {
            idx = i;
          } else {
            break;
          }
        }
        active = activeLyricsList[idx]?.words || '';
        prev = activeLyricsList[idx - 1]?.words || '';
        next = activeLyricsList[idx + 1]?.words || '';
      }
    }

    // C. If active line changed, stream directly to Mavis!
    if (active && active !== lastSentLine) {
      lastSentLine = active;
      console.log('[Mavis Bridge] Live Line ->', active);
      postToMavis({
        title: cur.title,
        artist: cur.artist,
        live_active_line: active,
        live_prev_line: prev,
        live_next_line: next,
      });
    }
  }

  // Run DOM & Audio mirror every 100ms
  setInterval(tickMirror, 100);

  // Check track changes every 500ms
  setInterval(() => {
    const cur = getCurrentTrack();
    if (cur && cur.trackId && cur.trackId !== lastTrackId) {
      lastSentLine = '';
      activeLyricsList = [];
      loadLyrics(cur.trackId, cur.title, cur.artist);
    }
  }, 500);
})();
