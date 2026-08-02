const API_BASE = 'http://localhost:3000/api';

// Get customer ID from login session
const customerId = sessionStorage.getItem('userId');

// Get selected stall information from URL
const urlParams = new URLSearchParams(window.location.search);
const stallId = urlParams.get('stallId');
const stallName = urlParams.get('stallName');

// ---------- Load Stall Information ----------
async function loadStallInformation() {
    try {
        if (!stallId) {
            throw new Error('Stall information is missing.');
        }

        document.getElementById('stallName').textContent =
            stallName || `Stall: ${stallId}`;

        document.getElementById('stallIdDisplay').textContent =
            `Stall ID: ${stallId}`;
    } catch (error) {
        document.getElementById('stallName').textContent = error.message;
        document.getElementById('stallIdDisplay').textContent = '';
    }
}

// ---------- Submit Rating & Comment ----------
async function submitFeedback(event) {
    event.preventDefault();

    const ratingInput = document.querySelector(
        'input[name="rating"]:checked'
    );
    const comment = document.getElementById('comment').value.trim();
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

    // Check customer login
    if (!customerId) {
        message.textContent = 'Please log in before submitting feedback.';
        message.className = 'message error';
        return;
    }

    // Check stall ID
    if (!stallId) {
        message.textContent = 'Stall information is missing.';
        message.className = 'message error';
        return;
    }

    const feedbackData = {
        customerId: customerId,
        stallId: stallId,
        fbkRating: Number(ratingInput.value),
        fbkComment: comment
    };

    try {
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            },
            body: JSON.stringify(feedbackData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || 'Unable to submit your feedback.'
            );
        }

        message.textContent =
            'Thank you! Your rating and comment have been submitted.';
        message.className = 'message success';

        document.getElementById('feedbackForm').reset();

        loadStallReviews();
    } catch (error) {
        console.error('Feedback error:', error);

        message.textContent =
            error.message || 'Something went wrong. Please try again.';
        message.className = 'message error';
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
                data.error || 'Unable to load stall reviews.'
            );
        }

        // Update average rating
        document.getElementById('averageRating').textContent =
            Number(data.avgRating || 0).toFixed(1);

        // Update average rating stars
        document.getElementById('averageStars').textContent =
            renderStars(Number(data.avgRating || 0));

        // Update rating count
        document.getElementById('ratingCount').textContent =
            `${data.count || 0} ratings`;

        // Display reviews
        displayReviews(data.reviews || []);
    } catch (error) {
        console.error('Load reviews error:', error);

        document.getElementById('reviewsList').innerHTML =
            '<p class="reviews-empty">Unable to load ratings and comments.</p>';
    }
}

// ---------- Display Reviews ----------
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');

    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML =
            '<p class="reviews-empty">No ratings or comments yet.</p>';
        return;
    }

    reviewsList.innerHTML = '';

    reviews.forEach((review) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-item';

        // Only show buttons for the logged-in customer's review
        const actionButtons =
            review.CustomerID === customerId
                ? `
                    <div class="review-actions">
                        <button
                            type="button"
                            class="edit-review-btn"
                            onclick="editFeedback('${review.FbkID}')">
                            Edit
                        </button>

                        <button
                            type="button"
                            class="delete-review-btn"
                            onclick="deleteFeedback('${review.FbkID}')">
                            Delete
                        </button>
                    </div>
                `
                : '';

        reviewCard.innerHTML = `
            <div class="review-top">
                <span class="review-rating">
                    ${renderStars(review.FbkRating)}
                </span>

                <span class="review-date">
                    ${
                        review.FbkDateTime
                            ? new Date(review.FbkDateTime).toLocaleDateString()
                            : ''
                    }
                </span>
            </div>

            <p class="review-comment">
                ${escapeHtml(review.FbkComment)}
            </p>

            ${actionButtons}
        `;

        reviewsList.appendChild(reviewCard);
    });
}

// ---------- Edit Feedback ----------
async function editFeedback(fbkID) {
    const newRating = prompt('Enter your new rating (1-5):');

    if (newRating === null) {
        return;
    }

    const rating = Number(newRating);

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        alert('Please enter a rating between 1 and 5.');
        return;
    }

    const newComment = prompt('Enter your new comment:');

    if (newComment === null) {
        return;
    }

    const comment = newComment.trim();

    // Validate comment
    if (!comment) {
        alert('Please enter a comment.');
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/feedback/${fbkID}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization':
                        `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify({
                    fbkRating: rating,
                    fbkComment: comment
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || 'Unable to update your feedback.'
            );
        }

        alert('Rating and comment updated successfully.');

        loadStallReviews();
    } catch (error) {
        console.error('Edit feedback error:', error);

        alert(
            error.message ||
            'Something went wrong while updating your feedback.'
        );
    }
}

// ---------- Delete Feedback ----------
async function deleteFeedback(fbkID) {
    const confirmDelete = confirm(
        'Are you sure you want to delete this rating and comment?'
    );

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/feedback/${fbkID}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization':
                        `Bearer ${localStorage.getItem('jwtToken')}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || 'Unable to delete your feedback.'
            );
        }

        alert('Rating and comment deleted successfully.');

        loadStallReviews();
    } catch (error) {
        console.error('Delete feedback error:', error);

        alert(
            error.message ||
            'Something went wrong while deleting your feedback.'
        );
    }
}

// ---------- Render Stars ----------
function renderStars(rating) {
    const rounded = Math.round(Number(rating) || 0);

    return (
        '★'.repeat(rounded) +
        '☆'.repeat(5 - rounded)
    );
}

// ---------- Escape HTML ----------
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

// ---------- Back to Order ----------
function goBack() {
    window.location.href = '/order';
}

// ---------- Event Listeners ----------
document
    .getElementById('feedbackForm')
    .addEventListener('submit', submitFeedback);

document
    .getElementById('backBtn')
    .addEventListener('click', goBack);

// ---------- Start Page ----------
async function init() {
    await loadStallInformation();
    await loadStallReviews();
}

init();
