# Mavis (Tauri 2.0 + React + GSAP)
# Command automation via Just

# Default recipe: display available recipes
default:
    @just --list

# Run native desktop app in development mode
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
