#!/usr/bin/env bash
set -eo pipefail

# Mavis Development Service Runner
# Ensures development environment (Node, Rust, Cargo, Wayland) is properly configured

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# Ensure common binary paths are available
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:$HOME/.hermes/tools/node-26.7.0-linux-x64/bin:$PATH"

# Fallback to Wayland / X11 display if not populated
if [ -z "$WAYLAND_DISPLAY" ] && [ -n "$XDG_RUNTIME_DIR" ] && [ -e "$XDG_RUNTIME_DIR/wayland-0" ]; then
    export WAYLAND_DISPLAY="wayland-0"
fi

if [ -z "$DISPLAY" ]; then
    export DISPLAY=":1"
fi

echo "Starting Mavis Dev Server (Tauri 2.0 + Vite HMR)..."
echo "Working Directory: $(pwd)"
echo "Display: WAYLAND_DISPLAY=$WAYLAND_DISPLAY, DISPLAY=$DISPLAY"

# Run Tauri dev mode (Vite HMR on :1420 + Rust watcher)
exec npm run tauri dev
