const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function safeClose(connection) {
    if (!connection) return;
    try {
        await connection.close();
    } catch (err) {
        console.error("Error closing connection: ", err);
    }
}

// Anyone can view — no ownership check needed
async function getMenuByStall(stallId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
            .input('stallId', sql.Char, stallId)
            .query('SELECT * FROM MenuItem WHERE StallID = @stallId');

        return result.recordset;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } finally {
        safeClose(connection);
    }
}

// Checks whether OwnerID has an active rental agreement for StallID
async function ownsStall(ownerId, stallId) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
            .input('ownerId', sql.Char, ownerId)
            .input('stallId', sql.Char, stallId)
            .query(`SELECT 1 FROM RentalAgreement 
                    WHERE OwnerID = @ownerId AND StallID = @stallId`);

        return result.recordset.length > 0;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } finally {
        safeClose(connection);
    }
}

async function addMenuItem(stallId, itemCode, item) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        await connection.request()
            .input('stallId', sql.Char, stallId)
            .input('itemCode', sql.Char, itemCode)
            .input('itemDesc', sql.VarChar, item.ItemDesc)
            .input('itemPrice', sql.SmallMoney, item.ItemPrice)
            .input('itemCategory', sql.VarChar, item.ItemCategory)
            .input('imagePath', sql.VarChar, item.ImagePath || null)
            .query(`INSERT INTO MenuItem (StallID, ItemCode, ItemDesc, ItemPrice, ItemCategory, ImagePath)
                    VALUES (@stallId, @itemCode, @itemDesc, @itemPrice, @itemCategory, @imagePath)`);

        return true;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } finally {
        safeClose(connection);
    }
}

async function updateMenuItem(stallId, itemCode, item) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
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
    } finally {
        safeClose(connection);
    }
}

async function deleteMenuItem(stallId, itemCode) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
            .input('stallId', sql.Char, stallId)
            .input('itemCode', sql.Char, itemCode)
            .query('DELETE FROM MenuItem WHERE StallID = @stallId AND ItemCode = @itemCode');

        return result.rowsAffected[0] > 0;

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    } finally {
        safeClose(connection);
    }
}

// LiangChen's api function
async function getAllMenuItems() {
  const pool = await sql.connect(dbConfig);
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
<<<<<<< HEAD
    deleteMenuItem
=======
    deleteMenuItem,
    getAllMenuItems 
>>>>>>> 29aaafed436e9e1b97f41d4b8f7050810b83643e
}