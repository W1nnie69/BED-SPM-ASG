const menuModel = require("../models/menuModel");

async function getMenuByStall(req, res) {
    try {
        const stallId = req.params.stallId;
        const menu = await menuModel.getMenuByStall(stallId);
        res.json(menu);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ error: "Error retrieving menu" });
    }
}

async function addMenuItem(req, res) {
    try {
        const { stallId } = req.params;
        const ownerId = req.session.userId;

        if (!ownerId) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const owns = await menuModel.ownsStall(ownerId, stallId);
        if (!owns) {
            return res.status(403).json({ error: "You don't own this stall" });
        }

        const { itemCode, ItemDesc, ItemPrice, ItemCategory } = req.body;
        await menuModel.addMenuItem(stallId, itemCode, { ItemDesc, ItemPrice, ItemCategory });

        res.status(201).json({ message: "Menu item added" });

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ error: "Error adding menu item" });
    }
}

async function updateMenuItem(req, res) {
    try {
        const { stallId, code } = req.params;
        const ownerId = req.session.userId;

        if (!ownerId) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const owns = await menuModel.ownsStall(ownerId, stallId);
        if (!owns) {
            return res.status(403).json({ error: "You don't own this stall" });
        }

        const { ItemDesc, ItemPrice, ItemCategory } = req.body;
        const updated = await menuModel.updateMenuItem(stallId, code, { ItemDesc, ItemPrice, ItemCategory });

        if (!updated) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.json({ message: "Menu item updated" });

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ error: "Error updating menu item" });
    }
}

async function deleteMenuItem(req, res) {
    try {
        const { stallId, code } = req.params;
        const ownerId = req.session.userId;

        if (!ownerId) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const owns = await menuModel.ownsStall(ownerId, stallId);
        if (!owns) {
            return res.status(403).json({ error: "You don't own this stall" });
        }

        const deleted = await menuModel.deleteMenuItem(stallId, code);

        if (!deleted) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.json({ message: "Menu item deleted" });

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ error: "Error deleting menu item" });
    }
}

//THIS IS SUPPOSED TO BE MODEL CODE!
// WILL MERGE FIRST, FIX LATER
module.exports = { getMenuByStall, addMenuItem, updateMenuItem, deleteMenuItem };const sql = require("mssql");
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