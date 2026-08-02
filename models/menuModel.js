const sql = require("mssql");
const dbConfig = require("../dbConfig");

const poolPromise = sql.connect(dbConfig);

// Anyone can view — no ownership check needed
async function getMenuByStall(stallId) {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('stallId', sql.Char, stallId)
            .query('SELECT * FROM MenuItem WHERE StallID = @stallId');

        return result.recordset;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } 
}

// Checks whether OwnerID has an active rental agreement for StallID
async function ownsStall(ownerId, stallId) {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('ownerId', sql.Char, ownerId)
            .input('stallId', sql.Char, stallId)
            .query(`SELECT 1 FROM RentalAgreement 
                    WHERE OwnerID = @ownerId AND StallID = @stallId`);

        return result.recordset.length > 0;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } 
}

async function addMenuItem(stallId, itemCode, item) {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('stallId', sql.Char, stallId)
            .input('itemCode', sql.Char, itemCode)
            .input('itemDesc', sql.VarChar, item.ItemDesc)
            .input('itemPrice', sql.SmallMoney, item.ItemPrice)
            .input('itemCategory', sql.VarChar, item.ItemCategory)
            .input("imagePath", sql.VarChar, item.ImagePath)
            .query(`
            INSERT INTO MenuItem
            (StallID, ItemCode, ItemDesc, ItemPrice, ItemCategory, ImagePath)
            VALUES
            (@stallId, @itemCode, @itemDesc, @itemPrice, @itemCategory, @imagePath)
            `);

        return true;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } 
}

async function updateMenuItem(stallId, itemCode, item) {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('stallId', sql.Char, stallId)
            .input('itemCode', sql.Char, itemCode)
            .input('itemDesc', sql.VarChar, item.ItemDesc)
            .input('itemPrice', sql.SmallMoney, item.ItemPrice)
            .input('itemCategory', sql.VarChar, item.ItemCategory)
            .query(`UPDATE MenuItem 
                    SET ItemDesc = @itemDesc, ItemPrice = @itemPrice, ItemCategory = @itemCategory
                    WHERE StallID = @stallId AND ItemCode = @itemCode`);

        return result.rowsAffected[0] > 0;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } 
}

async function deleteMenuItem(stallId, itemCode) {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('stallId', sql.Char, stallId)
            .input('itemCode', sql.Char, itemCode)
            .query('DELETE FROM MenuItem WHERE StallID = @stallId AND ItemCode = @itemCode');

        return result.rowsAffected[0] > 0;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } 
}
async function getMenuItem(stallId, itemCode) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("stallId", sql.Char, stallId)
        .input("itemCode", sql.Char, itemCode)
        .query(`
            SELECT ImagePath
            FROM MenuItem
            WHERE StallID = @stallId
            AND ItemCode = @itemCode
        `);

    return result.recordset[0] || null;
}

// LiangChen's api function
async function getAllMenuItems() {
    const pool = await poolPromise;
    const result = await pool.request().query(
    `SELECT mi.StallID, fs.StallName, mi.ItemCode, mi.ItemDesc, mi.ItemPrice, mi.ItemCategory
        FROM MenuItem mi
        JOIN FoodStall fs ON fs.StallID = mi.StallID
        ORDER BY fs.StallName, mi.ItemCategory, mi.ItemDesc`
    );

    return result.recordset;
}

module.exports = { 
    getMenuByStall, 
    ownsStall, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem,
    getAllMenuItems,
    deleteMenuItem,
    getMenuItem
}