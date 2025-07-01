// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Window;

#[tauri::command]
async fn close_window(window: Window) {
    window.close().unwrap();
}

#[tauri::command]
async fn minimize_window(window: Window) {
    window.minimize().unwrap();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![close_window, minimize_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 