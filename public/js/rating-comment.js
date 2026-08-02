const API_BASE = 'http://localhost:3000/api';

// Get customer ID from login session
const customerId = sessionStorage.getItem('userId');

// Get selected stall ID from URL
const urlParams = new URLSearchParams(window.location.search);
const stallId = urlParams.get('stallId');
const stallName = urlParams.get('stallName');

// ---------- Load Stall Information ----------
async function loadStallInformation() {

    try {

        // Check if stall ID exists
        if (!stallId) {
            throw new Error('Stall information is missing.');
        }

        // Display stall name
        document.getElementById('stallName').textContent =
            stallName || `Stall: ${stallId}`;

        // Display stall ID
        document.getElementById('stallIdDisplay').textContent =
            `Stall ID: ${stallId}`;

    } catch (error) {

        document.getElementById('stallName').textContent =
            error.message;

        document.getElementById('stallIdDisplay').textContent =
            '';

    }
}

// ---------- Submit Rating & Comment ----------
async function submitFeedback(event) {
    event.preventDefault();

    // Get rating and comment entered by customer
    const ratingInput = document.querySelector(
        'input[name="rating"]:checked'
    );

    const comment = document
        .getElementById('comment')
        .value
        .trim();

    const message = document.getElementById('message');


    // Validate rating
    if (!ratingInput) {
        message.textContent = 'Please select a rating.';
        message.className = 'message error';
        return;
    }


    // Validate comment
    if (!comment) {
        message.textContent = 'Please enter a comment.';
        message.className = 'message error';
        return;
    }


    // Make sure customer is logged in
    if (!customerId) {
        message.textContent =
            'Please log in before submitting feedback.';

        message.className = 'message error';
        return;
    }


    // Make sure a stall was selected
    if (!stallId) {
        message.textContent =
            'Stall information is missing.';

        message.className = 'message error';
        return;
    }


    // Prepare feedback data
    const feedbackData = {
        customerId: customerId,
        stallId: stallId,
        fbkRating: Number(ratingInput.value),
        fbkComment: comment
    };


    try {

        // Send feedback to backend
        const response = await fetch(
            `${API_BASE}/feedback`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':
                        `Bearer ${localStorage.getItem('jwtToken')}`
                },

                body: JSON.stringify(feedbackData)
            }
        );


        const data = await response.json();


        // Handle backend errors
        if (!response.ok) {
            throw new Error(
                data.error ||
                'Unable to submit your feedback.'
            );
        }


        // Show success message
        message.textContent =
            'Thank you! Your rating and comment have been submitted.';

        message.className = 'message success';


        // Clear the form
        document
            .getElementById('feedbackForm')
            .reset();


        // Reload reviews after submitting
        loadStallReviews();


    } catch (error) {

        console.error(
            'Feedback error:',
            error
        );

        message.textContent =
            error.message ||
            'Something went wrong. Please try again.';

        message.className =
            'message error';
    }
}


// ---------- Load Stall Ratings & Comments ----------
async function loadStallReviews() {

    if (!stallId) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/feedback/stall/${stallId}`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Unable to load stall reviews.'
            );

        }

        // Update average rating number
        document.getElementById(
            'averageRating'
        ).textContent =
            Number(data.avgRating || 0).toFixed(1);

        // Update average rating stars
        document.getElementById(
            'averageStars'
        ).textContent =
            renderStars(
                Number(data.avgRating || 0)
            );

        // Update total number of ratings
        document.getElementById(
            'ratingCount'
        ).textContent =
            `${data.count || 0} ratings`;

        // Display all customer reviews
        displayReviews(
            data.reviews || []
        );

    } catch (error) {

        console.error(
            'Load reviews error:',
            error
        );

        document.getElementById(
            'reviewsList'
        ).innerHTML =
            '<p class="reviews-empty">Unable to load ratings and comments.</p>';

    }
}




// ---------- Display Reviews ----------
function displayReviews(reviews) {

    const reviewsList =
        document.getElementById('reviewsList');

    // No reviews available
    if (!reviews || reviews.length === 0) {

        reviewsList.innerHTML =
            '<p class="reviews-empty">No ratings or comments yet.</p>';

        return;
    }

    // Clear existing reviews
    reviewsList.innerHTML = '';

    // Display each review
    reviews.forEach((review) => {

        const reviewCard =
            document.createElement('div');

        reviewCard.className =
            'review-item';

        reviewCard.innerHTML = `

            <div class="review-top">

                <span class="review-rating">
                    ${renderStars(review.FbkRating)}
                </span>

                <span class="review-date">
                    ${
                        review.FbkDateTime
                            ? new Date(review.FbkDateTime)
                                .toLocaleDateString()
                            : ''
                    }
                </span>

            </div>

            <p class="review-comment">
                ${escapeHtml(review.FbkComment)}
            </p>

        `;

        reviewsList.appendChild(reviewCard);

    });
}


// ---------- Render Stars ----------
function renderStars(rating) {

    const rounded =
        Math.round(Number(rating) || 0);

    return (
        '★'.repeat(rounded) +
        '☆'.repeat(5 - rounded)
    );

}


// ---------- Escape HTML ----------
function escapeHtml(str) {
    const div =document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}


// ---------- Back to Order ----------
function goBack() {window.location.href ='/order';}


// ---------- Event Listeners ----------
document
    .getElementById('feedbackForm')
    .addEventListener(
        'submit',
        submitFeedback
    );


document
    .getElementById('backBtn')
    .addEventListener(
        'click',
        goBack
    );


// ---------- Start Page ----------
async function init() {
    await loadStallInformation();
    await loadStallReviews();
}
init();