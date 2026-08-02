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

// Retrieves the total number of likes for a food item
async function getLikeCount(req, res) {

    const { stallId, itemCode } = req.params;

    try {

        const likeCount = await likeModel.getLikeCount(
            stallId,
            itemCode
        );

        res.status(200).json({
            stallId,
            itemCode,
            likeCount
        });

    } catch (error) {

        console.error("Controller error:", error);

        res.status(500).json({
            error: "Error retrieving like count."
        });

    }
}

// Checks whether a customer has liked a food item
async function hasLikedFood(req, res) {

    const { customerId, stallId, itemCode } = req.params;

    try {

        const liked = await likeModel.hasLikedFood(
            customerId,
            stallId,
            itemCode
        );

        res.status(200).json({
            liked
        });

    } catch (error) {

        console.error("Controller error:", error);

        res.status(500).json({
            error: "Error checking like status."
        });

    }
}



//RATINGS & COMMENTS
// Handles a customer's request to submit a rating and comment
async function addFeedback(req, res) {
    const {
        fbkComment,
        fbkRating,
        customerId,
        stallId
    } = req.body;

    try {
        await likeModel.addFeedback(
            fbkComment,
            fbkRating,
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

// Handles a customer's request to delete their rating and comment
async function deleteFeedback(req, res) {

    const fbkID = req.params.fbkID;

    try {

        await likeModel.deleteFeedback(fbkID);

        res.status(200).json({
            message: "Rating and comment deleted successfully."
        });

    } catch (error) {

        console.error("Controller error:", error);

        res.status(500).json({
            error: "Error deleting rating and comment."
        });

    }
}

// Retrieves the average rating, total number of ratings,
// and all ratings/comments for a stall
async function getStallRating(req, res) {

    const stallId = req.params.stallId;

    try {

        // Get average rating and total number of ratings
        const ratingData = await likeModel.getStallRating(stallId);

        // Get all ratings and comments for the stall
        const reviews = await likeModel.getStallReviews(stallId);

        res.status(200).json({
            avgRating: Number(ratingData.avgRating),
            count: ratingData.count,
            reviews: reviews
        });

    } catch (error) {

        console.error("Controller error:", error);

        res.status(500).json({
            error: "Error retrieving stall ratings and reviews."
        });

    }
}


// Retrieves all ratings and comments for a stall
async function getStallReviews(req, res) {

    const stallId = req.params.stallId;

    try {

        const reviews = await likeModel.getStallReviews(stallId);

        res.status(200).json(reviews);

    } catch (error) {

        console.error("Controller error:", error);

        res.status(500).json({
            error: "Error retrieving stall reviews."
        });

    }
}

module.exports = {
    likeFood,
    getLikedFoods,
    unlikeFood,
    getLikeCount,
    hasLikedFood,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    getStallRating,
    getStallReviews
};