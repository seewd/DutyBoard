struct ShowMode(bool);

/// --show or not
#[tauri::command]
fn get_show_mode(state: tauri::State<'_, ShowMode>) -> bool {
    state.0
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Runtime --show CLI flag overrides everything
    let explicit_show = std::env::args().any(|arg| arg == "--show");

    // 2. Compile-time feature flag (cargo tauri build --features show)
    #[cfg(feature = "show")]
    let feature_show = true;
    #[cfg(not(feature = "show"))]
    let feature_show = false;

    // 3. Dev builds default to show; release builds default to hide
    #[cfg(debug_assertions)]
    let debug_default = true;
    #[cfg(not(debug_assertions))]
    let debug_default = false;

    let show_mode = explicit_show || feature_show || debug_default;

    tauri::Builder::default()
        .manage(ShowMode(show_mode))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_positioner::init())
        .invoke_handler(tauri::generate_handler![get_show_mode])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
