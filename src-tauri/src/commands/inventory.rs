use crate::models::{Product, InventoryHistory, DashboardStats, BulkImportResult};

fn db() -> Result<std::sync::MutexGuard<'static, rusqlite::Connection>, String> {
    crate::db::DB
        .get()
        .ok_or_else(|| "DB not initialised".to_string())?
        .lock()
        .map_err(|e| e.to_string())
}

fn parse_product(row: &rusqlite::Row) -> rusqlite::Result<Product> {
    let current_stock: i64 = row.get(7)?;
    Ok(Product {
        id: row.get(0)?,
        name: row.get(1)?,
        barcode: row.get(2)?,
        sku: row.get(3)?,
        category: row.get(4)?,
        purchase_price: row.get(5)?,
        selling_price: row.get(6)?,
        current_stock,
        min_stock: row.get(8)?,
        status: row.get(9)?,
        item_id: row.get(10)?,
        barcode_type: row.get(11)?,
        track_inventory: current_stock >= 0,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

const PRODUCT_COLS: &str = "id, name, barcode, sku, category, purchase_price, selling_price, current_stock, min_stock, status, item_id, barcode_type, created_at, updated_at";

// ═══════════════════════════════════════════════════════════
// Product CRUD
// ═══════════════════════════════════════════════════════════

#[tauri::command]
pub fn get_products(search: Option<String>, category: Option<String>, status: Option<String>) -> Result<Vec<Product>, String> {
    let db = db()?;
    let mut conditions = vec!["1=1".to_string()];
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    if let Some(ref s) = search {
        if !s.trim().is_empty() {
            conditions.push("(name LIKE ?1 OR barcode LIKE ?1 OR sku LIKE ?1)".to_string());
            params.push(Box::new(format!("%{}%", s.trim())));
        }
    }
    if let Some(ref c) = category {
        if !c.trim().is_empty() {
            let idx = params.len() + 1;
            conditions.push(format!("category = ?{}", idx));
            params.push(Box::new(c.trim().to_string()));
        }
    }
    if let Some(ref st) = status {
        if !st.trim().is_empty() {
            let idx = params.len() + 1;
            conditions.push(format!("status = ?{}", idx));
            params.push(Box::new(st.trim().to_string()));
        }
    }

    let sql = format!(
        "SELECT {} FROM products WHERE {} ORDER BY updated_at DESC LIMIT 500",
        PRODUCT_COLS,
        conditions.join(" AND ")
    );

    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), parse_product).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_product(id: i64) -> Result<Product, String> {
    let db = db()?;
    let sql = format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS);
    db.query_row(&sql, rusqlite::params![id], parse_product).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_product(
    name: String,
    barcode: Option<String>,
    sku: Option<String>,
    category: Option<String>,
    purchase_price: Option<f64>,
    purchasePrice: Option<f64>,
    selling_price: Option<f64>,
    sellingPrice: Option<f64>,
    current_stock: Option<i64>,
    currentStock: Option<i64>,
    min_stock: Option<i64>,
    minStock: Option<i64>,
    track_inventory: Option<bool>,
    trackInventory: Option<bool>,
    barcode_type: Option<String>,
    barcodeType: Option<String>,
    item_id: Option<i64>,
    itemId: Option<i64>,
) -> Result<Product, String> {
    let db = db()?;

    let barcode_val = barcode.unwrap_or_default();
    let sku_val = sku.unwrap_or_default();
    let cat_val = category.unwrap_or_default();
    let p_price = purchase_price.or(purchasePrice).unwrap_or(0.0);
    let s_price = selling_price.or(sellingPrice).unwrap_or(0.0);
    let min_stk = min_stock.or(minStock).unwrap_or(0);
    let b_type = barcode_type.or(barcodeType).unwrap_or_else(|| "internal".to_string());
    let mut item_id_val = item_id.or(itemId);

    let is_tracked = track_inventory.or(trackInventory);
    let stock = match is_tracked {
        Some(false) => -1,
        Some(true) => current_stock.or(currentStock).unwrap_or(0).max(0),
        None => current_stock.or(currentStock).unwrap_or(-1),
    };

    // Generate barcode if empty (internal type)
    let final_barcode = if barcode_val.trim().is_empty() {
        generate_internal_barcode(&db, &name)?
    } else {
        barcode_val.trim().to_string()
    };

    // Generate SKU if empty
    let final_sku = if sku_val.trim().is_empty() {
        generate_sku(&db, &name)?
    } else {
        sku_val.trim().to_string()
    };

    // Check barcode uniqueness
    let exists: bool = db.query_row(
        "SELECT COUNT(*) > 0 FROM products WHERE barcode = ?1",
        rusqlite::params![final_barcode], |r| r.get(0)
    ).unwrap_or(false);
    if exists { return Err(format!("Barcode '{}' already exists", final_barcode)); }

    // Ensure category exists in categories table
    let category_clean = cat_val.trim();
    let cat_id: i64 = if !category_clean.is_empty() {
        match db.query_row(
            "SELECT id FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?1)) LIMIT 1",
            rusqlite::params![category_clean],
            |r| r.get(0),
        ) {
            Ok(id) => id,
            Err(_) => {
                let _ = db.execute(
                    "INSERT INTO categories (name, sort_order, is_active) VALUES (?1, 0, 1)",
                    rusqlite::params![category_clean],
                );
                db.last_insert_rowid()
            }
        }
    } else {
        1
    };

    // Ensure item exists in items table so Billing POS displays it immediately
    if item_id_val.is_none() {
        let _ = db.execute(
            "INSERT INTO items (category_id, name, price, is_active, sort_order, barcode, sku, current_stock, min_stock) VALUES (?1, ?2, ?3, 1, 0, ?4, ?5, ?6, ?7)",
            rusqlite::params![cat_id, name.trim(), s_price, final_barcode, final_sku, stock, min_stk],
        );
        item_id_val = Some(db.last_insert_rowid());
    }

    // Determine initial status
    let status = if stock < 0 { "active" }
        else if stock == 0 { "out_of_stock" }
        else if stock <= min_stk { "low_stock" }
        else { "active" };

    db.execute(
        "INSERT INTO products (name, barcode, sku, category, purchase_price, selling_price, current_stock, min_stock, status, item_id, barcode_type)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        rusqlite::params![name.trim(), final_barcode, final_sku, cat_val.trim(), p_price, s_price, stock, min_stk, status, item_id_val, b_type.trim()],
    ).map_err(|e| e.to_string())?;

    let product_id = db.last_insert_rowid();

    // Audit log
    log_inventory(&db, product_id, &name, &final_barcode, 0, stock, stock, "product_created", "", "")?;

    let sql = format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS);
    db.query_row(&sql, rusqlite::params![product_id], parse_product).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_product(
    id: i64,
    name: String,
    barcode: Option<String>,
    sku: Option<String>,
    category: Option<String>,
    purchase_price: Option<f64>,
    purchasePrice: Option<f64>,
    selling_price: Option<f64>,
    sellingPrice: Option<f64>,
    current_stock: Option<i64>,
    currentStock: Option<i64>,
    min_stock: Option<i64>,
    minStock: Option<i64>,
    track_inventory: Option<bool>,
    trackInventory: Option<bool>,
    item_id: Option<i64>,
    itemId: Option<i64>,
) -> Result<Product, String> {
    let db = db()?;

    let barcode_val = barcode.unwrap_or_default();
    let sku_val = sku.unwrap_or_default();
    let cat_val = category.unwrap_or_default();
    let p_price = purchase_price.or(purchasePrice).unwrap_or(0.0);
    let s_price = selling_price.or(sellingPrice).unwrap_or(0.0);
    let min_stk = min_stock.or(minStock).unwrap_or(0);
    let mut item_id_val = item_id.or(itemId);

    let is_tracked = track_inventory.or(trackInventory);
    let stock_val: Option<i64> = match is_tracked {
        Some(false) => Some(-1),
        Some(true) => Some(current_stock.or(currentStock).unwrap_or(10).max(0)),
        None => current_stock.or(currentStock),
    };

    // Check barcode uniqueness (excluding self)
    let exists: bool = db.query_row(
        "SELECT COUNT(*) > 0 FROM products WHERE barcode = ?1 AND id != ?2",
        rusqlite::params![barcode_val.trim(), id], |r| r.get(0)
    ).unwrap_or(false);
    if !barcode_val.trim().is_empty() && exists {
        return Err(format!("Barcode '{}' already assigned to another product", barcode_val.trim()));
    }

    if let Some(stk) = stock_val {
        db.execute(
            "UPDATE products SET name=?1, barcode=?2, sku=?3, category=?4, purchase_price=?5, selling_price=?6, current_stock=?7, min_stock=?8, item_id=?9, updated_at=CURRENT_TIMESTAMP WHERE id=?10",
            rusqlite::params![name.trim(), barcode_val.trim(), sku_val.trim(), cat_val.trim(), p_price, s_price, stk, min_stk, item_id_val, id],
        ).map_err(|e| e.to_string())?;
    } else {
        db.execute(
            "UPDATE products SET name=?1, barcode=?2, sku=?3, category=?4, purchase_price=?5, selling_price=?6, min_stock=?7, item_id=?8, updated_at=CURRENT_TIMESTAMP WHERE id=?9",
            rusqlite::params![name.trim(), barcode_val.trim(), sku_val.trim(), cat_val.trim(), p_price, s_price, min_stk, item_id_val, id],
        ).map_err(|e| e.to_string())?;
    }

    // Keep items table synchronized with updated price, category, name, stock
    let category_clean = cat_val.trim();
    let cat_id: Option<i64> = if !category_clean.is_empty() {
        db.query_row(
            "SELECT id FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?1)) LIMIT 1",
            rusqlite::params![category_clean],
            |r| r.get(0),
        ).ok()
    } else {
        None
    };

    if let Some(iid) = item_id_val {
        if let Some(cid) = cat_id {
            let _ = db.execute(
                "UPDATE items SET name=?1, price=?2, category_id=?3 WHERE id=?4",
                rusqlite::params![name.trim(), s_price, cid, iid],
            );
        } else {
            let _ = db.execute(
                "UPDATE items SET name=?1, price=?2 WHERE id=?3",
                rusqlite::params![name.trim(), s_price, iid],
            );
        }
    } else {
        // Link to matching item in items table if exists
        let existing_iid: Option<i64> = db.query_row(
            "SELECT id FROM items WHERE LOWER(TRIM(name)) = LOWER(TRIM(?1)) LIMIT 1",
            rusqlite::params![name.trim()],
            |r| r.get(0),
        ).ok();
        if let Some(iid) = existing_iid {
            let _ = db.execute("UPDATE products SET item_id=?1 WHERE id=?2", rusqlite::params![iid, id]);
            if let Some(cid) = cat_id {
                let _ = db.execute("UPDATE items SET price=?1, category_id=?2 WHERE id=?3", rusqlite::params![s_price, cid, iid]);
            } else {
                let _ = db.execute("UPDATE items SET price=?1 WHERE id=?2", rusqlite::params![s_price, iid]);
            }
        }
    }

    // Recalculate status
    recalculate_status(&db, id)?;

    let sql = format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS);
    db.query_row(&sql, rusqlite::params![id], parse_product).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_product(id: i64) -> Result<(), String> {
    let db = db()?;
    let product = db.query_row(
        &format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS),
        rusqlite::params![id], parse_product
    ).map_err(|e| e.to_string())?;

    // Clear foreign key records from inventory_history before deleting product
    let _ = db.execute("DELETE FROM inventory_history WHERE product_id = ?1", rusqlite::params![id]);

    // Also delete from items if linked or matching name
    if let Some(iid) = product.item_id {
        let _ = db.execute("DELETE FROM items WHERE id = ?1", rusqlite::params![iid]);
    }
    let _ = db.execute("DELETE FROM items WHERE LOWER(TRIM(name)) = LOWER(TRIM(?1))", rusqlite::params![product.name.trim()]);

    db.execute("DELETE FROM products WHERE id = ?1", rusqlite::params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_product(id: i64, enabled: bool) -> Result<(), String> {
    let db = db()?;
    let new_status = if enabled { "active" } else { "disabled" };
    db.execute(
        "UPDATE products SET status = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        rusqlite::params![new_status, id],
    ).map_err(|e| e.to_string())?;
    if enabled { recalculate_status(&db, id)?; }
    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Barcode Lookup (< 200ms target)
// ═══════════════════════════════════════════════════════════

#[tauri::command]
pub fn lookup_barcode(barcode: String) -> Result<Option<Product>, String> {
    let db = db()?;
    let clean = barcode.trim().replace('\r', "").replace('\n', "");
    if clean.is_empty() { return Ok(None); }

    // Search products table first (indexed)
    let sql = format!("SELECT {} FROM products WHERE barcode = ?1 LIMIT 1", PRODUCT_COLS);
    match db.query_row(&sql, rusqlite::params![clean], parse_product) {
        Ok(p) => return Ok(Some(p)),
        Err(rusqlite::Error::QueryReturnedNoRows) => {},
        Err(e) => return Err(e.to_string()),
    }

    // Fallback: search items table barcode column
    // Returns a virtual Product (NOT inserted into DB) so the item can be added to cart
    let item_sql = "SELECT id, name, price, barcode FROM items WHERE barcode = ?1 AND is_active = 1 LIMIT 1";
    match db.query_row(item_sql, rusqlite::params![clean], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, f64>(2)?, row.get::<_, String>(3)?))
    }) {
        Ok((item_id, name, price, bc)) => {
            // Return virtual product — no DB write, stock untracked (-1)
            Ok(Some(Product {
                id: 0,
                name,
                barcode: bc,
                sku: String::new(),
                category: String::new(),
                purchase_price: 0.0,
                selling_price: price,
                current_stock: -1,
                min_stock: 0,
                status: "active".to_string(),
                item_id: Some(item_id),
                barcode_type: "manufacturer".to_string(),
                track_inventory: false,
                created_at: String::new(),
                updated_at: String::new(),
            }))
        },
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub fn assign_barcode(product_id: i64, barcode: String) -> Result<(), String> {
    let db = db()?;
    let clean = barcode.trim().to_string();

    let exists: bool = db.query_row(
        "SELECT COUNT(*) > 0 FROM products WHERE barcode = ?1 AND id != ?2",
        rusqlite::params![clean, product_id], |r| r.get(0)
    ).unwrap_or(false);
    if exists { return Err("Barcode already assigned to another product".to_string()); }

    let product = db.query_row(
        &format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS),
        rusqlite::params![product_id], parse_product
    ).map_err(|e| e.to_string())?;

    db.execute(
        "UPDATE products SET barcode = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        rusqlite::params![clean, product_id],
    ).map_err(|e| e.to_string())?;

    log_inventory(&db, product_id, &product.name, &clean, product.current_stock, 0, product.current_stock, "barcode_assigned", "", "")?;
    Ok(())
}

// ═══════════════════════════════════════════════════════════
// Stock Operations
// ═══════════════════════════════════════════════════════════

#[tauri::command]
pub fn add_stock(id: i64, qty: i64, remarks: String) -> Result<Product, String> {
    let db = db()?;
    if qty <= 0 { return Err("Quantity must be positive".to_string()); }

    let product = db.query_row(
        &format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS),
        rusqlite::params![id], parse_product
    ).map_err(|e| e.to_string())?;

    let prev = product.current_stock;
    let new_stock = if prev < 0 { qty } else { prev + qty }; // -1 means untracked → initialize

    db.execute(
        "UPDATE products SET current_stock = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        rusqlite::params![new_stock, id],
    ).map_err(|e| e.to_string())?;

    recalculate_status(&db, id)?;
    log_inventory(&db, id, &product.name, &product.barcode, prev, qty, new_stock, "stock_added", "", &remarks)?;

    let sql = format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS);
    db.query_row(&sql, rusqlite::params![id], parse_product).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reduce_stock(id: i64, qty: i64, remarks: String) -> Result<Product, String> {
    let db = db()?;
    if qty <= 0 { return Err("Quantity must be positive".to_string()); }

    let product = db.query_row(
        &format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS),
        rusqlite::params![id], parse_product
    ).map_err(|e| e.to_string())?;

    let prev = product.current_stock;
    let new_stock = (prev - qty).max(0);

    db.execute(
        "UPDATE products SET current_stock = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        rusqlite::params![new_stock, id],
    ).map_err(|e| e.to_string())?;

    recalculate_status(&db, id)?;
    log_inventory(&db, id, &product.name, &product.barcode, prev, -qty, new_stock, "stock_reduced", "", &remarks)?;

    let sql = format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS);
    db.query_row(&sql, rusqlite::params![id], parse_product).map_err(|e| e.to_string())
}

/// Pre-checkout stock validation — returns Ok(()) if all items have sufficient stock
#[tauri::command]
pub fn validate_cart_stock(items: Vec<serde_json::Value>) -> Result<(), String> {
    let db = db()?;
    for item in &items {
        let barcode = item.get("barcode").and_then(|v| v.as_str()).unwrap_or("");
        let product_id = item.get("product_id").and_then(|v| v.as_i64()).unwrap_or(0);
        let qty = item.get("qty").and_then(|v| v.as_i64()).unwrap_or(1);
        if qty <= 0 || (product_id == 0 && barcode.is_empty()) { continue; }

        let product = if product_id > 0 {
            let sql = format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS);
            db.query_row(&sql, rusqlite::params![product_id], parse_product).ok()
        } else {
            let sql = format!("SELECT {} FROM products WHERE barcode = ?1 LIMIT 1", PRODUCT_COLS);
            db.query_row(&sql, rusqlite::params![barcode], parse_product).ok()
        };
        if let Some(p) = product {
            if p.current_stock < 0 { continue; }
            if p.current_stock < qty {
                return Err(format!("Insufficient stock for '{}': available {}, requested {}", p.name, p.current_stock, qty));
            }
        }
    }
    Ok(())
}

/// Post-payment atomic inventory deduction for all items in an order.
/// Phase 1: Validate ALL items. Phase 2: Deduct ALL in a transaction.
/// If ANY item has insufficient stock, NOTHING is deducted.
#[tauri::command]
pub fn deduct_inventory(items: Vec<serde_json::Value>, invoice_number: String) -> Result<(), String> {
    let mut db = db()?;

    // Phase 1: Validate and collect deductions
    struct Ded { pid: i64, name: String, bc: String, prev: i64, qty: i64, ns: i64, min: i64, st: String }
    let mut deds: Vec<Ded> = Vec::new();

    for item in &items {
        let barcode = item.get("barcode").and_then(|v| v.as_str()).unwrap_or("");
        let product_id = item.get("product_id").and_then(|v| v.as_i64()).unwrap_or(0);
        let qty = item.get("qty").and_then(|v| v.as_i64()).unwrap_or(1);
        if qty <= 0 || (product_id == 0 && barcode.is_empty()) { continue; }

        let product = if product_id > 0 {
            let sql = format!("SELECT {} FROM products WHERE id = ?1", PRODUCT_COLS);
            db.query_row(&sql, rusqlite::params![product_id], parse_product).ok()
        } else {
            let sql = format!("SELECT {} FROM products WHERE barcode = ?1 LIMIT 1", PRODUCT_COLS);
            db.query_row(&sql, rusqlite::params![barcode], parse_product).ok()
        };
        if let Some(p) = product {
            if p.current_stock < 0 { continue; }
            if p.current_stock < qty {
                return Err(format!("Insufficient stock for '{}': available {}, requested {}", p.name, p.current_stock, qty));
            }
            deds.push(Ded { pid: p.id, name: p.name, bc: p.barcode, prev: p.current_stock, qty, ns: p.current_stock - qty, min: p.min_stock, st: p.status });
        }
    }
    if deds.is_empty() { return Ok(()); }

    // Phase 2: Atomic deduction
    let tx = db.transaction().map_err(|e| e.to_string())?;
    for d in &deds {
        tx.execute("UPDATE products SET current_stock=?1, updated_at=CURRENT_TIMESTAMP WHERE id=?2",
            rusqlite::params![d.ns, d.pid]).map_err(|e| e.to_string())?;
        if d.st != "disabled" {
            let ns = if d.ns == 0 { "out_of_stock" } else if d.ns <= d.min { "low_stock" } else { "active" };
            tx.execute("UPDATE products SET status=?1 WHERE id=?2", rusqlite::params![ns, d.pid]).map_err(|e| e.to_string())?;
        }
        tx.execute("INSERT INTO inventory_history (product_id,product_name,barcode,previous_stock,qty_changed,current_stock,action,invoice_number,remarks) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)",
            rusqlite::params![d.pid, d.name, d.bc, d.prev, -(d.qty), d.ns, "sale", &invoice_number, ""]).map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// ═══════════════════════════════════════════════════════════
// History & Dashboard
// ═══════════════════════════════════════════════════════════

#[tauri::command]
pub fn get_inventory_history(product_id: Option<i64>, limit: Option<i64>) -> Result<Vec<InventoryHistory>, String> {
    let db = db()?;
    let lim = limit.unwrap_or(100);

    let (sql, pid) = if let Some(pid) = product_id {
        ("SELECT id, product_id, product_name, barcode, previous_stock, qty_changed, current_stock, action, invoice_number, user_name, remarks, created_at FROM inventory_history WHERE product_id = ?1 ORDER BY id DESC LIMIT ?2".to_string(), Some(pid))
    } else {
        ("SELECT id, product_id, product_name, barcode, previous_stock, qty_changed, current_stock, action, invoice_number, user_name, remarks, created_at FROM inventory_history ORDER BY id DESC LIMIT ?1".to_string(), None)
    };

    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    let parse = |row: &rusqlite::Row| -> rusqlite::Result<InventoryHistory> {
        Ok(InventoryHistory {
            id: row.get(0)?, product_id: row.get(1)?, product_name: row.get(2)?,
            barcode: row.get(3)?, previous_stock: row.get(4)?, qty_changed: row.get(5)?,
            current_stock: row.get(6)?, action: row.get(7)?, invoice_number: row.get(8)?,
            user_name: row.get(9)?, remarks: row.get(10)?, created_at: row.get(11)?,
        })
    };

    let rows = if let Some(p) = pid {
        stmt.query_map(rusqlite::params![p, lim], parse).map_err(|e| e.to_string())?
    } else {
        stmt.query_map(rusqlite::params![lim], parse).map_err(|e| e.to_string())?
    };

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_dashboard_stats() -> Result<DashboardStats, String> {
    let db = db()?;
    let q = |sql: &str| -> i64 { db.query_row(sql, [], |r| r.get(0)).unwrap_or(0) };

    Ok(DashboardStats {
        total_products: q("SELECT COUNT(*) FROM products"),
        active_products: q("SELECT COUNT(*) FROM products WHERE status = 'active'"),
        low_stock: q("SELECT COUNT(*) FROM products WHERE status = 'low_stock'"),
        out_of_stock: q("SELECT COUNT(*) FROM products WHERE status = 'out_of_stock'"),
        added_today: q("SELECT COUNT(*) FROM products WHERE date(created_at) = date('now', 'localtime')"),
        updated_today: q("SELECT COUNT(*) FROM products WHERE date(updated_at) = date('now', 'localtime') AND date(created_at) != date(updated_at)"),
    })
}

#[tauri::command]
pub fn get_low_stock_products() -> Result<Vec<Product>, String> {
    let db = db()?;
    let sql = format!(
        "SELECT {} FROM products WHERE status IN ('low_stock', 'out_of_stock') ORDER BY current_stock ASC LIMIT 100",
        PRODUCT_COLS
    );
    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], parse_product).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ═══════════════════════════════════════════════════════════
// Bulk Import
// ═══════════════════════════════════════════════════════════

#[tauri::command]
pub fn bulk_import_products(csv_data: String) -> Result<BulkImportResult, String> {
    let db = db()?;
    let mut imported = 0i64;
    let mut skipped = 0i64;
    let mut errors = Vec::new();

    let lines: Vec<&str> = csv_data.lines().collect();
    if lines.is_empty() { return Err("Empty CSV data".to_string()); }

    // Skip header line
    for (i, line) in lines.iter().enumerate().skip(1) {
        let cols: Vec<&str> = line.split(',').map(|s| s.trim().trim_matches('"')).collect();
        if cols.len() < 4 {
            errors.push(format!("Row {}: insufficient columns", i + 1));
            skipped += 1;
            continue;
        }

        let name = cols[0].to_string();
        let barcode = cols.get(1).unwrap_or(&"").to_string();
        let sku_raw = cols.get(2).unwrap_or(&"").to_string();
        let category = cols.get(3).unwrap_or(&"").to_string();
        let purchase_price: f64 = cols.get(4).and_then(|s| s.parse().ok()).unwrap_or(0.0);
        let selling_price: f64 = cols.get(5).and_then(|s| s.parse().ok()).unwrap_or(0.0);
        let opening_stock: i64 = cols.get(6).and_then(|s| s.parse().ok()).unwrap_or(0);
        let min_stock_val: i64 = cols.get(7).and_then(|s| s.parse().ok()).unwrap_or(0);

        if name.is_empty() {
            errors.push(format!("Row {}: missing product name", i + 1));
            skipped += 1;
            continue;
        }

        let final_barcode = if barcode.is_empty() {
            generate_internal_barcode(&db, &name).unwrap_or_default()
        } else {
            barcode
        };

        let final_sku = if sku_raw.is_empty() {
            generate_sku(&db, &name).unwrap_or_default()
        } else {
            sku_raw
        };

        // Check duplicates
        let bc_exists: bool = db.query_row(
            "SELECT COUNT(*) > 0 FROM products WHERE barcode = ?1",
            rusqlite::params![final_barcode], |r| r.get(0)
        ).unwrap_or(false);
        if bc_exists {
            errors.push(format!("Row {}: duplicate barcode '{}'", i + 1, final_barcode));
            skipped += 1;
            continue;
        }

        let status = if opening_stock == 0 { "out_of_stock" }
            else if opening_stock <= min_stock_val { "low_stock" }
            else { "active" };

        match db.execute(
            "INSERT INTO products (name, barcode, sku, category, purchase_price, selling_price, current_stock, min_stock, status, barcode_type)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'manufacturer')",
            rusqlite::params![name, final_barcode, final_sku, category, purchase_price, selling_price, opening_stock, min_stock_val, status],
        ) {
            Ok(_) => {
                let pid = db.last_insert_rowid();
                let _ = log_inventory(&db, pid, &name, &final_barcode, 0, opening_stock, opening_stock, "product_created", "", "bulk import");
                imported += 1;
            },
            Err(e) => {
                errors.push(format!("Row {}: {}", i + 1, e));
                skipped += 1;
            }
        }
    }

    Ok(BulkImportResult { imported, skipped, errors })
}

// ═══════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════

fn generate_internal_barcode(conn: &rusqlite::Connection, name: &str) -> Result<String, String> {
    let prefix: String = name.trim().chars()
        .filter(|c| c.is_alphanumeric())
        .take(3)
        .collect::<String>()
        .to_uppercase();
    let prefix = if prefix.is_empty() { "PRD".to_string() } else { prefix };

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM products WHERE barcode LIKE ?1",
        rusqlite::params![format!("{}%", prefix)], |r| r.get(0)
    ).unwrap_or(0);

    Ok(format!("{}{:06}", prefix, count + 1))
}

fn generate_sku(conn: &rusqlite::Connection, name: &str) -> Result<String, String> {
    let prefix: String = name.trim().chars()
        .filter(|c| c.is_alphanumeric())
        .take(3)
        .collect::<String>()
        .to_uppercase();
    let prefix = if prefix.is_empty() { "SKU".to_string() } else { prefix };

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM products WHERE sku LIKE ?1",
        rusqlite::params![format!("{}%", prefix)], |r| r.get(0)
    ).unwrap_or(0);

    Ok(format!("SKU-{}-{:04}", prefix, count + 1))
}

fn recalculate_status(conn: &rusqlite::Connection, id: i64) -> Result<(), String> {
    let (stock, min, current_status): (i64, i64, String) = conn.query_row(
        "SELECT current_stock, min_stock, status FROM products WHERE id = ?1",
        rusqlite::params![id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?))
    ).map_err(|e| e.to_string())?;

    if current_status == "disabled" { return Ok(()); }
    if stock < 0 { return Ok(()); } // Untracked

    let new_status = if stock == 0 { "out_of_stock" }
        else if stock <= min { "low_stock" }
        else { "active" };

    if new_status != current_status {
        conn.execute(
            "UPDATE products SET status = ?1 WHERE id = ?2",
            rusqlite::params![new_status, id],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn log_inventory(
    conn: &rusqlite::Connection, product_id: i64, name: &str, barcode: &str,
    prev: i64, changed: i64, current: i64, action: &str, invoice: &str, remarks: &str,
) -> Result<(), String> {
    conn.execute(
        "INSERT INTO inventory_history (product_id, product_name, barcode, previous_stock, qty_changed, current_stock, action, invoice_number, remarks)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![product_id, name, barcode, prev, changed, current, action, invoice, remarks],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
