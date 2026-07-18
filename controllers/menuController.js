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

module.exports = { getMenuByStall, addMenuItem, updateMenuItem, deleteMenuItem };