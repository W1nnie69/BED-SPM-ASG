const likeModel = require('../models/custEngagementModel');

//LIKES
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



//RATINGS & COMMENTS
// Handles a customer's request to submit a rating and comment
async function addFeedback(req, res) {

    const {
        fbkID,
        fbkComment,
        fbkRating,
        fbkDateTime,
        customerId,
        stallId
    } = req.body;

    try {

        await likeModel.addFeedback(
            fbkID,
            fbkComment,
            fbkRating,
            fbkDateTime,
            customerId,
            stallId
        );

        res.status(200).json({
            message: "Rating and comment submitted successfully."
        });

    } catch (error) {

        console.error("Controller error:", error);

        res.status(500).json({
            error: "Error submitting rating and comment."
        });

    }
}

// Handles a customer's request to edit their rating and comment
async function updateFeedback(req, res) {

    const fbkID = req.params.fbkID;
    const { fbkComment, fbkRating } = req.body;

    try {

        await likeModel.updateFeedback(
            fbkID,
            fbkComment,
            fbkRating
        );

        res.status(200).json({
            message: "Rating and comment updated successfully."
        });

    } catch (error) {

        console.error("Controller error:", error);

        res.status(500).json({
            error: "Error updating rating and comment."
        });

    }
}

module.exports = {
    likeFood,
    getLikedFoods,
    unlikeFood,
    addFeedback,
    updateFeedback
};