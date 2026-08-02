javascript
const API_BASE = 'http://localhost:3000/api';

// Get customer ID from login session
const customerId = sessionStorage.getItem('userId');

// Get selected stall ID from URL
const urlParams = new URLSearchParams(window.location.search);
const stallId = urlParams.get('stallId');

// ---------- Load Stall Information ----------
async function loadStallInformation() {
    try {
        if (!stallId) {
            throw new Error('Stall information is missing.');
        }

        document.getElementById('stallName').textContent = `Stall: ${stallId}`;
    } catch (error) {
        document.getElementById('stallName').textContent = error.message;
    }
}

// ---------- Submit Rating & Comment ----------
async function submitFeedback(event) {
    event.preventDefault();

    // Get rating and comment entered by customer
    const ratingInput = document.querySelector('input[name="rating"]:checked');
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

    // Make sure customer is logged in
    if (!customerId) {
        message.textContent = 'Please log in before submitting feedback.';
        message.className = 'message error';
        return;
    }

    // Make sure a stall was selected
    if (!stallId) {
        message.textContent = 'Stall information is missing.';
        message.className = 'message error';
        return;
    }

    // Prepare feedback data for the backend
    const feedbackData = {
        customerId: customerId,
        stallId: stallId,
        fbkRating: Number(ratingInput.value),
        fbkComment: comment
    };

    try {
        // Send feedback to backend
        const response = await fetch(`${API_BASE}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
            },
            body: JSON.stringify(feedbackData)
        });

        const data = await response.json();

        // Handle backend errors
        if (!response.ok) {
            throw new Error(data.error || 'Unable to submit your feedback.');
        }

        // Show success message
        message.textContent = 'Thank you! Your rating and comment have been submitted.';
        message.className = 'message success';

        // Clear the form
        document.getElementById('feedbackForm').reset();
    } catch (error) {
        console.error('Feedback error:', error);
        message.textContent = error.message || 'Something went wrong. Please try again.';
        message.className = 'message error';
    }
}

// ---------- Back to Menu ----------
function goBack() {
    window.location.href = '/menu';
}

// ---------- Event Listeners ----------
document.getElementById('feedbackForm').addEventListener('submit', submitFeedback);
document.getElementById('backBtn').addEventListener('click', goBack);

// ---------- Start Page ----------
loadStallInformation();
