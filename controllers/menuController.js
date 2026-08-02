const menuModel = require("../models/menuModel");
const jwt = require("jsonwebtoken");

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

// Protected by verifyToken in app.js — req.user is set by that middleware
async function addMenuItem(req, res) {
    try {
        const { stallId } = req.params;
        const ownerId = req.user.userId;

        const owns = await menuModel.ownsStall(ownerId, stallId);
        if (!owns) {
            return res.status(403).json({ error: "You don't own this stall" });
        }

        const { itemCode, ItemDesc, ItemPrice, ItemCategory } = req.body;

        // multer puts the uploaded file info on req.file when using upload.single()
        const ImagePath = req.file ? `/uploads/menu-items/${req.file.filename}` : null;

        await menuModel.addMenuItem(stallId, itemCode, { ItemDesc, ItemPrice, ItemCategory, ImagePath });

        res.status(201).json({ message: "Menu item added", imagePath: ImagePath });

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ error: "Error adding menu item" });
    }
}

// Protected by verifyToken in app.js — req.user is set by that middleware
async function updateMenuItem(req, res) {
    try {
        const { stallId, code } = req.params;
        const ownerId = req.user.userId;

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

// Protected by verifyToken in app.js — req.user is set by that middleware
async function deleteMenuItem(req, res) {
    try {
        const { stallId, code } = req.params;
        const ownerId = req.user.userId;

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

/**
 * GET /api/stall/:stallId/owns
 * NOT behind verifyToken — needs to work gracefully whether the visitor is
 * logged in or not (frontend calls this just to decide whether to show the
 * "add item" form). Manually decodes the token if one is present.
 */
async function checkOwnership(req, res) {
    try {
        const { stallId } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.json({ owns: false });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.json({ owns: false });
            }

            try {
                const owns = await menuModel.ownsStall(decoded.userId, stallId);
                res.json({ owns });
            } catch (error) {
                console.error("Controller error: ", error);
                res.status(500).json({ error: "Error checking ownership" });
            }
        });

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ error: "Error checking ownership" });
    }
}

/**
 * GET /api/menu
 * Read-only helper so the front-end can render real stalls/items.
 * NOT an individually graded feature - full menu management (add/edit/
 * delete items) belongs to whichever teammate owns Vendor/Menu management.
 */

// LiangChen's api function
async function getAllMenuItems(req, res) {
  try {
    const items = await menuModel.getAllMenuItems();
    return res.status(200).json({ items });
  } catch (err) {
    console.error("getAllMenuItems error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve menu.", details: err.message });
  }
}

module.exports = {
    getMenuByStall,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    checkOwnership,
    getAllMenuItems
}