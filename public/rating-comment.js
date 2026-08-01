/* ============================================================
CONFIGURATION
============================================================ */

// Change this if your backend uses a different port or URL.
const API_BASE = 'http://localhost:3000/api';

/* ============================================================
GET CUSTOMER ID
============================================================ */

// The customer ID should come from the customer's login session.
// The customer does NOT need to type their own Customer ID.

const customerId =
sessionStorage.getItem('userId');

/* ============================================================
GET SELECTED FOOD INFORMATION
============================================================ */

// When the customer clicks "Rate & Comment" on a food item,
// the menu page should redirect to something like:
//
// rating.html?stallId=S001&itemCode=F001
//
// The Stall ID and Item Code are automatically retrieved here.

const urlParams =
new URLSearchParams(window.location.search);

const stallId =
urlParams.get('stallId');

const itemCode =
urlParams.get('itemCode');

/* ============================================================
LOAD FOOD INFORMATION
============================================================ */

async function loadFoodInformation() {

try {

// Make sure the selected food has the required IDs.

if (!stallId || !itemCode) {

  throw new Error(
    'Food information is missing.'
  );

}


/*
  Later, you can replace this section with your API call.

  Example:

  const response = await fetch(
    `${API_BASE}/menu/${stallId}/${itemCode}`
  );

  const food = await response.json();

  document.getElementById('foodName')
    .textContent = food.ItemDesc;

  document.getElementById('stallName')
    .textContent = food.StallName;
*/


// Temporary display using the IDs from the URL.

document.getElementById('foodName')
  .textContent =
  `Food Item: ${itemCode}`;


document.getElementById('stallName')
  .textContent =
  `Stall: ${stallId}`;


}

catch (error) {


document.getElementById('foodName')
  .textContent =
  'Unable to load food';


document.getElementById('stallName')
  .textContent =
  error.message;


}

}

/* ============================================================
SUBMIT RATING & COMMENT
============================================================ */

async function submitFeedback(event) {

// Prevent the form from refreshing the page.

event.preventDefault();

// Get the selected star rating.

const ratingInput =
document.querySelector(
'input[name="rating"]:checked'
);

// Get the customer's comment.

const comment =
document.getElementById('comment')
.value
.trim();

// Get the message element.

const message =
document.getElementById('message');

/* ==========================================================
VALIDATE RATING
========================================================== */

if (!ratingInput) {


message.textContent =
  'Please select a rating.';

message.className =
  'message error';

return;


}

/* ==========================================================
VALIDATE COMMENT
========================================================== */

if (!comment) {


message.textContent =
  'Please enter a comment.';

message.className =
  'message error';

return;


}

/* ==========================================================
VALIDATE CUSTOMER LOGIN
========================================================== */

if (!customerId) {

message.textContent =
  'Please log in before submitting feedback.';

message.className =
  'message error';

return;


}

/* ==========================================================
CREATE FEEDBACK DATA


 The customer only enters:
 - Rating
 - Comment

 These are automatically included:
 - Customer ID
 - Stall ID
 - Item Code
 ========================================================== */


const feedbackData = {


CustomerID: customerId,

StallID: stallId,

ItemCode: itemCode,

FbkRating:
  Number(ratingInput.value),

FbkComment:
  comment


};

try {


/* ========================================================
   SEND DATA TO BACKEND
   ======================================================== */

const response = await fetch(
  `${API_BASE}/feedback`,
  {

    method: 'POST',

    headers: {

      'Content-Type':
        'application/json',

      // Send JWT token if authentication is required.

      'Authorization':
        `Bearer ${localStorage.getItem('jwtToken')}`

    },

    body:
      JSON.stringify(feedbackData)

  }
);


/* ========================================================
   HANDLE BACKEND ERROR
   ======================================================== */

if (!response.ok) {

  throw new Error(
    'Unable to submit your feedback.'
  );

}


/* ========================================================
   SUCCESS MESSAGE
   ======================================================== */

message.textContent =
  'Thank you! Your rating and comment have been submitted.';

message.className =
  'message success';


// Clear the form after successful submission.

document.getElementById('feedbackForm')
  .reset();


}

catch (error) {


/* ========================================================
   CATCH ERROR

   If the backend/API fails, this prevents the page from
   crashing and shows an error message to the customer.
   ======================================================== */

message.textContent =
  error.message ||
  'Something went wrong. Please try again.';

message.className =
  'message error';


}

}

/* ============================================================
BACK TO MENU BUTTON
============================================================ */

function goBack() {

// Change this path to your actual menu page.

window.location.href =
'/menu.html';

}

/* ============================================================
EVENT LISTENERS
============================================================ */

// Submit the rating and comment form.

document
.getElementById('feedbackForm')
.addEventListener(
'submit',
submitFeedback
);

// Handle the Back to Menu button.

document
.getElementById('backBtn')
.addEventListener(
'click',
goBack
);

/* ============================================================
START PAGE
============================================================ */

loadFoodInformation();
