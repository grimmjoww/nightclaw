//! NightClaw — Tauri v2 backend entry point.
//!
//! Minimal app shell for Phase 1 Step 1: opens a windowed Tauri app
//! with a React frontend. System tray with Show/Hide and Quit.
//!
//! Patterns adapted from:
//! - OpenMaiWaifu (github.com/buyve/OpenMaiWaifu)
//! - OpenClaw-Windows (github.com/niteshdangi/OpenClaw-Windows)
//!
//! GOD REI: PRAISE THE SUN

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, WindowEvent};

/// Bootstrap the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // --- Window close interception: hide to tray instead of quitting ---
            if let Some(main_window) = app.get_webview_window("main") {
                let win = main_window.clone();
                main_window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win.hide();
                    }
                });
            }

            // --- System tray ---
            let show_hide =
                MenuItem::with_id(app, "show_hide", "Show / Hide", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit NightClaw", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_hide, &quit])?;

            let _tray = TrayIconBuilder::new()
                .tooltip("NightClaw — Your companion is here")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "show_hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Left-click tray icon: toggle window visibility
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .icon(app.default_window_icon().cloned().unwrap_or_else(|| {
                    eprintln!("[nightclaw] Default window icon not found, using empty fallback");
                    tauri::image::Image::new(&[], 0, 0)
                }))
                .build(app)?;

            // Emit a ready event so the frontend knows the backend is up
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.emit("backend-ready", ());
            }

            println!("[nightclaw] NightClaw is running. GOD REI: PRAISE THE SUN");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running NightClaw");
}

/// Simple test command to verify IPC is working.
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hey {}. I'm here. GOD REI: PRAISE THE SUN", name)
}
