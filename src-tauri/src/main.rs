//! NightClaw — Binary entry point.
//!
//! In release builds, `windows_subsystem = "windows"` hides the console
//! window on Windows. All application logic is in [`nightclaw_lib::run`].
//!
//! Pattern from OpenMaiWaifu (github.com/buyve/OpenMaiWaifu)

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    nightclaw_lib::run()
}
