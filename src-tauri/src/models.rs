use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub sort_order: i64,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Item {
    pub id: i64,
    pub category_id: i64,
    pub name: String,
    pub price: f64,
    pub is_active: bool,
    pub sort_order: i64,
    #[serde(default)]
    pub image_url: String,
    #[serde(default)]
    pub barcode: String,
    #[serde(default)]
    pub sku: String,
    #[serde(default)]
    pub track_inventory: bool,
    #[serde(default)]
    pub current_stock: i64,
    #[serde(default)]
    pub min_stock: i64,
    #[serde(default)]
    pub product_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderItem {
    pub item_id: i64,
    pub name: String,
    pub price: f64,
    pub qty: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Order {
    pub id: i64,
    pub items: Vec<OrderItem>,
    pub subtotal: f64,
    pub total: f64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub shop_name: String,
    pub shop_tagline: String,
    pub shop_address: String,
    pub shop_phone: String,
    pub bill_footer: String,
    pub printer_name: String,
    pub printer_type: String, // "usb" | "bluetooth" | "network" | "name"
    pub logo_enabled: bool,
    pub has_cutter: bool,
    pub gst_percent: f64,
    pub payment_mode: String, // "Cash" | "UPI" | "Card" | ""
    #[serde(default)]
    pub cloudinary_cloud_name: String,
    #[serde(default)]
    pub cloudinary_upload_preset: String,
    #[serde(default)]
    pub admin_pin_hash: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: i64,
    pub name: String,
    pub barcode: String,
    pub sku: String,
    pub category: String,
    pub purchase_price: f64,
    pub selling_price: f64,
    pub current_stock: i64,
    pub min_stock: i64,
    pub status: String,
    pub item_id: Option<i64>,
    pub barcode_type: String,
    #[serde(default)]
    pub track_inventory: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventoryHistory {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub barcode: String,
    pub previous_stock: i64,
    pub qty_changed: i64,
    pub current_stock: i64,
    pub action: String,
    pub invoice_number: String,
    pub user_name: String,
    pub remarks: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardStats {
    pub total_products: i64,
    pub active_products: i64,
    pub low_stock: i64,
    pub out_of_stock: i64,
    pub added_today: i64,
    pub updated_today: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BulkImportResult {
    pub imported: i64,
    pub skipped: i64,
    pub errors: Vec<String>,
}
