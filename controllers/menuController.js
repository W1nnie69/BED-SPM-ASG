const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * GET /api/menu
 * Read-only helper so the front-end can render real stalls/items.
 * NOT an individually graded feature - full menu management (add/edit/
 * delete items) belongs to whichever teammate owns Vendor/Menu management.
 */
async function getAllMenuItems(req, res) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(
      `SELECT mi.StallID, fs.StallName, mi.ItemCode, mi.ItemDesc, mi.ItemPrice, mi.ItemCategory
       FROM MenuItem mi
       JOIN FoodStall fs ON fs.StallID = mi.StallID
       ORDER BY fs.StallName, mi.ItemCategory, mi.ItemDesc`
    );

    return res.status(200).json({ items: result.recordset });
  } catch (err) {
    console.error("getAllMenuItems error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve menu.", details: err.message });
  }
}

module.exports = { getAllMenuItems };