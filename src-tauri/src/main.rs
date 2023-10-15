// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{path::Path, fs::OpenOptions, io::Write};
use font_kit::source::SystemSource;
use tauri::api::private::OnceCell;
use trash;
use notify::{Watcher, RecursiveMode};
use chrono;

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

static mut CELL: OnceCell<notify::ReadDirectoryChangesWatcher> = OnceCell::new();

#[tauri::command]
fn start_watch(window: tauri::Window, path: String) -> () {
    let cell_value = unsafe {
        CELL.get_or_init(|| {
            notify::recommended_watcher(move |res|
                match res {
                    Ok(_event) => {
                        window.emit("change", None::<&str>).unwrap();
                    }
                    Err(_e) => ()
                }
            ).unwrap()
        });
        CELL.get_mut()
    };
    if let Some(watcher) = cell_value {
        watcher.watch(Path::new(&path), RecursiveMode::Recursive).unwrap();
    }
}

#[tauri::command]
fn log(path: String, level: String, msg: String) -> () {
    let mut file = match OpenOptions::new()
        .create(true)
        .append(true)
        .open(path) {
            Ok(file) => file,
            Err(e) => {
                eprintln!("Error opening log file: {}", e);
                return;
            }
        };
    let now = chrono::Local::now();
    let date = now.format("%Y-%m-%d %H:%M:%S");
    let log = format!("{}:{}:{}\n", date, level, msg);
    if let Err(e) = file.write_all(log.as_bytes()) {
        eprintln!("Error writing to log file: {}", e);
    }
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_fs_extra::init())
    .invoke_handler(tauri::generate_handler![list_fonts, trash_delete, start_watch, log])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}