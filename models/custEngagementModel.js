const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Inserts a customer's liked food item into the Likes table in the database.
async function likeFood(customerId, stallId, itemCode) {

    const connection = await sql.connect(dbConfig);

    const query = `
        INSERT INTO Likes (CustomerID, StallID, ItemCode)
        VALUES (@customerId, @stallId, @itemCode)
    `;

    await connection.request()
        .input('customerId', sql.Char(5), customerId)
        .input('stallId', sql.Char(5), stallId)
        .input('itemCode', sql.Char(5), itemCode)
        .query(query);

    connection.close();
}

// Retrieves all food items liked by a customer
async function getLikedFoods(customerId) {

    const connection = await sql.connect(dbConfig);

    const query = `
        SELECT
            L.CustomerID,
            M.ItemCode,
            M.ItemDesc,
            M.ItemPrice,
            M.ItemCategory
        FROM Likes L
        INNER JOIN MenuItem M
            ON L.StallID = M.StallID
            AND L.ItemCode = M.ItemCode
        WHERE L.CustomerID = @customerId
    `;

    const result = await connection.request()
        .input('customerId', sql.Char(5), customerId)
        .query(query);

    connection.close();

    return result.recordset;
}


module.exports = {
    likeFood,
    getLikedFoods
};