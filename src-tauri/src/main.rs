//! Binary entry point for the NightClaw Tauri app.
//!
//! In release builds, `windows_subsystem = "windows"` hides the console
//! window on Windows. All application logic is in [`nightclaw_lib::run`].

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    nightclaw_lib::run()
}
