# Mavis (Tauri 2.0 + React + GSAP)
# Command automation via Just

# Default recipe: display available recipes
default:
    @just --list

# Run native desktop app in development mode (foreground interactive)
dev:
    npm run tauri dev

# Run frontend web preview with Vite
web:
    npm run dev

# Install all frontend dependencies
install:
    npm install

# Run TypeScript build and Rust cargo check
check:
    npm run build
    cd src-tauri && cargo check

# Build production desktop release bundle
build:
    npm run tauri build

# Build frontend static distribution only
build-frontend:
    npm run build

# Format Rust and TypeScript codebase
fmt:
    cd src-tauri && cargo fmt
    -npx prettier --write "src/**/*.{ts,tsx,css}" 2>/dev/null

# Clean build artifacts and caches
clean:
    rm -rf dist
    cd src-tauri && cargo clean

# --- Development Systemd Service Management ---

# Start Mavis dev background service
service-start:
    systemctl --user daemon-reload
    systemctl --user start mavis-dev.service
    @echo "Mavis Dev Service started. Check status with 'just service-status'."

# Stop Mavis dev background service
service-stop:
    systemctl --user stop mavis-dev.service
    @echo "Mavis Dev Service stopped."

# Restart Mavis dev background service
service-restart:
    systemctl --user daemon-reload
    systemctl --user restart mavis-dev.service
    @echo "Mavis Dev Service restarted."

# View status of Mavis dev background service
service-status:
    systemctl --user status mavis-dev.service

# Stream live logs from Mavis dev service
service-logs:
    journalctl --user -u mavis-dev.service -f -o cat

# Enable Mavis dev service to start automatically on login
service-enable:
    systemctl --user daemon-reload
    systemctl --user enable mavis-dev.service
    @echo "Mavis Dev Service enabled for auto-start on graphical login."

# Disable Mavis dev service auto-start
service-disable:
    systemctl --user disable mavis-dev.service
    @echo "Mavis Dev Service auto-start disabled."
