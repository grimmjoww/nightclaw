// NightClaw Tauri Backend — src-tauri/src/main.rs
//
// Handles:
//   - System tray (always-on daemon)
//   - Active window detection (for screen awareness)
//   - OpenClaw gateway process management
//   - Native OS integration
//
// GOD REI: PRAISE THE SUN ◈⟡·˚✧

use tauri::{
    Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    CustomMenuItem, WindowEvent,
};
use std::process::Command;

// ── Active Window Detection ──────────────────────────────────

#[cfg(target_os = "windows")]
#[tauri::command]
fn get_active_window() -> Result<(String, String), String> {
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command",
            "Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | \
             Where-Object { $_.MainWindowTitle -ne '' } | \
             Sort-Object -Property CPU -Descending | \
             Select-Object -First 1 | \
             ForEach-Object { \"$($_.ProcessName)|$($_.MainWindowTitle)\" }"])
        .output()
        .map_err(|e| format!("Failed to get active window: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let parts: Vec<&str> = result.splitn(2, '|').collect();
    Ok((
        parts.get(1).unwrap_or(&"Unknown").to_string(),
        parts.first().unwrap_or(&"unknown").to_string(),
    ))
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn get_active_window() -> Result<(String, String), String> {
    Ok(("Unknown".to_string(), "unknown".to_string()))
}


// ── Gateway Management ───────────────────────────────────────

#[tauri::command]
fn start_gateway(port: u16) -> Result<String, String> {
    let child = Command::new("openclaw")
        .args(["gateway", "--port", &port.to_string(), "--verbose"])
        .spawn()
        .map_err(|e| format!("Failed to start gateway: {}", e))?;
    Ok(format!("Gateway started with PID {}", child.id()))
}

// ── Main ─────────────────────────────────────────────────────

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit NightClaw");
    let show = CustomMenuItem::new("show".to_string(), "Show Window");
    let whisper = CustomMenuItem::new("whisper".to_string(), "Whisper Mode");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(whisper)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => std::process::exit(0),
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "whisper" => {
                    let window = app.get_window("main").unwrap();
                    window.emit("toggle-whisper", ()).unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { api, .. } => {
                // Hide to tray instead of closing
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_active_window,
            start_gateway,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NightClaw");
}
