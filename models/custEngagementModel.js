const sql = require('mssql');
const dbConfig = require('../dbConfig');

//LIKES
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

// Removes a customer's liked food item from the Likes table
async function unlikeFood(customerId, stallId, itemCode) {

    const connection = await sql.connect(dbConfig);

    const query = `
        DELETE FROM Likes
        WHERE CustomerID = @customerId
        AND StallID = @stallId
        AND ItemCode = @itemCode
    `;

    await connection.request()
        .input('customerId', sql.Char(5), customerId)
        .input('stallId', sql.Char(5), stallId)
        .input('itemCode', sql.Char(5), itemCode)
        .query(query);

    connection.close();
}



//RATINGS & COMMENTS
// Adds a customer's rating and comment for a food stall
async function addFeedback(fbkID, fbkComment, fbkRating, fbkDateTime, customerId, stallId) {

    const connection = await sql.connect(dbConfig);

    const query = `
        INSERT INTO Feedback
        (FbkID, FbkComment, FbkRating, FbkDateTime, CustomerID, StallID)
        VALUES
        (@fbkID, @fbkComment, @fbkRating, @fbkDateTime, @customerId, @stallId)
    `;

    await connection.request()
        .input('fbkID', sql.Char(5), fbkID)
        .input('fbkComment', sql.VarChar(1000), fbkComment)
        .input('fbkRating', sql.Int, fbkRating)
        .input('fbkDateTime', sql.DateTime, fbkDateTime)
        .input('customerId', sql.Char(5), customerId)
        .input('stallId', sql.Char(5), stallId)
        .query(query);

    connection.close();
}

module.exports = {
    likeFood,
    getLikedFoods,
    unlikeFood,
    addFeedback
};