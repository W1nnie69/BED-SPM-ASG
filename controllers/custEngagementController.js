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

// Retrieves all food items liked by a customer
async function getLikedFoods(req, res) {

    const customerId = req.params.customerId;

    try {

        const likedFoods = await likeModel.getLikedFoods(customerId);

        res.status(200).json(likedFoods);

    } catch (error) {

        console.error("Controller error:", error);
        res.status(500).json({
            error: "Error retrieving liked foods."
        });

    }
}

// Handles a customer's request to unlike a food item
async function unlikeFood(req, res) {

    const { customerId, stallId, itemCode } = req.body;

    try {

        await likeModel.unlikeFood(customerId, stallId, itemCode);

        res.status(200).json({
            message: "Food unliked successfully."
        });

    } catch (error) {

        console.error("Controller error:", error);
        res.status(500).json({
            error: "Error unliking food."
        });

    }
}

module.exports = {
    likeFood,
    getLikedFoods,
    unlikeFood
};