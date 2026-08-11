// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod models;
mod commands;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let app_data_dir = app.path()
                .app_data_dir()
                .expect("Failed to get app data dir")
                .to_string_lossy()
                .to_string();

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            db::init(&app_data_dir)
                .expect("Database initialisation failed");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::menu::get_categories,
            commands::menu::create_category,
            commands::menu::update_category,
            commands::menu::delete_category,
            commands::menu::get_items,
            commands::menu::create_item,
            commands::menu::update_item,
            commands::menu::update_item_image,
            commands::menu::delete_item,
            commands::menu::seed_default_menu,
            commands::orders::save_order,
            commands::orders::get_orders,
            commands::orders::get_summary,
            commands::orders::open_orders_csv,
            commands::orders::get_data_info,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::save_logo,
            commands::settings::get_logo,
            commands::settings::delete_logo,
            commands::print::print_receipt,
            commands::print::generate_receipt_html,
            commands::print::list_printers,
            commands::license::validate_license,
            commands::license::get_license_status,
            commands::license::get_machine_id,
            commands::license::revalidate_license_with_server,
            commands::inventory::get_products,
            commands::inventory::get_product,
            commands::inventory::create_product,
            commands::inventory::update_product,
            commands::inventory::delete_product,
            commands::inventory::toggle_product,
            commands::inventory::lookup_barcode,
            commands::inventory::assign_barcode,
            commands::inventory::add_stock,
            commands::inventory::reduce_stock,
            commands::inventory::deduct_inventory,
            commands::inventory::validate_cart_stock,
            commands::inventory::get_inventory_history,
            commands::inventory::get_dashboard_stats,
            commands::inventory::get_low_stock_products,
            commands::inventory::bulk_import_products,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running BillEasy");
}
