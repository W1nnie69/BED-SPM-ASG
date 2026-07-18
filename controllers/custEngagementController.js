const likeModel = require('../models/custEngagementModel');

// Processes the customer's like request and returns a success or error response.
async function likeFood(req, res) {
    const { customerId, stallId, itemCode } = req.body;

    try {
        await likeModel.likeFood(customerId, stallId, itemCode);

        res.status(200).json({
            message: "Food liked successfully."
        });

    } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({
            error: "Error liking food."
        });
    }
}

module.exports = {
    likeFood
};