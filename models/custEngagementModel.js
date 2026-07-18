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

module.exports = {
    likeFood
};