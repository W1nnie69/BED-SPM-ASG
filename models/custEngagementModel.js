const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Create the connection pool ONCE when the app starts
const poolPromise = sql.connect(dbConfig);

//LIKES
// Inserts a customer's liked food item into the Likes table in the database.
async function likeFood(customerId, stallId, itemCode) {
    const pool = await poolPromise;

    const query = `
        INSERT INTO Likes (CustomerID, StallID, ItemCode)
        VALUES (@customerId, @stallId, @itemCode)
    `;

    await pool.request()
        .input('customerId', sql.Char(5), customerId)
        .input('stallId', sql.Char(5), stallId)
        .input('itemCode', sql.Char(5), itemCode)
        .query(query);
}

// Retrieves all food items liked by a customer
async function getLikedFoods(customerId) {
    const pool = await poolPromise;

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

    const result = await pool.request()
        .input('customerId', sql.Char(5), customerId)
        .query(query);

    return result.recordset;
}

// Removes a customer's liked food item from the Likes table
async function unlikeFood(customerId, stallId, itemCode) {
    const pool = await poolPromise;

    const query = `
        DELETE FROM Likes
        WHERE CustomerID = @customerId
        AND StallID = @stallId
        AND ItemCode = @itemCode
    `;

    await pool.request()
        .input('customerId', sql.Char(5), customerId)
        .input('stallId', sql.Char(5), stallId)
        .input('itemCode', sql.Char(5), itemCode)
        .query(query);
}

// Retrieves the total number of likes for a food item
async function getLikeCount(stallId, itemCode) {
    const pool = await poolPromise;

    const query = `
        SELECT COUNT(*) AS LikeCount
        FROM Likes
        WHERE StallID = @stallId
        AND ItemCode = @itemCode
    `;

    const result = await pool.request()
        .input('stallId', sql.Char(5), stallId)
        .input('itemCode', sql.Char(5), itemCode)
        .query(query);

    return result.recordset[0].LikeCount;
}

// Checks whether a customer has already liked a food item
async function hasLikedFood(customerId, stallId, itemCode) {
    const pool = await poolPromise;

    const query = `
        SELECT COUNT(*) AS LikeExists
        FROM Likes
        WHERE CustomerID = @customerId
        AND StallID = @stallId
        AND ItemCode = @itemCode
    `;

    const result = await pool.request()
        .input('customerId', sql.Char(5), customerId)
        .input('stallId', sql.Char(5), stallId)
        .input('itemCode', sql.Char(5), itemCode)
        .query(query);

    return result.recordset[0].LikeExists > 0;
}

//RATINGS & COMMENTS
// Adds a customer's rating and comment for a food stall
async function addFeedback(fbkID, fbkComment, fbkRating, fbkDateTime, customerId, stallId) {
    const pool = await poolPromise;

    const query = `
        INSERT INTO Feedback
        (FbkID, FbkComment, FbkRating, FbkDateTime, CustomerID, StallID)
        VALUES
        (@fbkID, @fbkComment, @fbkRating, @fbkDateTime, @customerId, @stallId)
    `;

    await pool.request()
        .input('fbkID', sql.Char(5), fbkID)
        .input('fbkComment', sql.VarChar(1000), fbkComment)
        .input('fbkRating', sql.Int, fbkRating)
        .input('fbkDateTime', sql.DateTime, fbkDateTime)
        .input('customerId', sql.Char(5), customerId)
        .input('stallId', sql.Char(5), stallId)
        .query(query);
}

// Updates a customer's rating and comment for existing feedback
async function updateFeedback(fbkID, fbkComment, fbkRating) {
    const pool = await poolPromise;

    const query = `
        UPDATE Feedback
        SET FbkComment = @fbkComment,
            FbkRating = @fbkRating
        WHERE FbkID = @fbkID
    `;

    await pool.request()
        .input('fbkID', sql.Char(5), fbkID)
        .input('fbkComment', sql.VarChar(1000), fbkComment)
        .input('fbkRating', sql.Int, fbkRating)
        .query(query);
}

// Deletes existing feedback from the Feedback table
async function deleteFeedback(fbkID) {
    const pool = await poolPromise;

    const query = `
        DELETE FROM Feedback
        WHERE FbkID = @fbkID
    `;

    await pool.request()
        .input('fbkID', sql.Char(5), fbkID)
        .query(query);
}

module.exports = {
    likeFood,
    getLikedFoods,
    unlikeFood,
    getLikeCount,
    hasLikedFood,
    addFeedback,
    updateFeedback,
    deleteFeedback
};