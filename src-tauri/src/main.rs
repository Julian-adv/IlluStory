// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use font_kit::source::SystemSource;
use trash;

#[tauri::command]
fn trash_delete(path: String) -> String {
    match trash::delete(path) {
        Ok(()) => "Ok",
        Err(_error) => "Error"
    }.to_string()
}

fn get_fonts() -> Vec<String> {
    let source = SystemSource::new();
    let families = source.all_families().unwrap_or(Vec::new());
    families.into_iter().collect()
}

#[tauri::command]
fn list_fonts() -> Vec<String> {
    get_fonts()
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_fs_extra::init())
    .invoke_handler(tauri::generate_handler![list_fonts, trash_delete])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}