// ---------------------------------------------------------------
// CONFIG
// Assumed endpoint: POST /api/:userType/signup
// Body shape differs per type - see buildPayload() below.
// This route doesn't exist in your backend yet.
// ---------------------------------------------------------------
const API_BASE = 'http://localhost:3000/api';

let selectedType = 'Customer';

const tabs = document.querySelectorAll('.type-tab');
const customerFields = document.getElementById('customerFields');
const stallOwnerFields = document.getElementById('stallOwnerFields');
const operatorFields = document.getElementById('operatorFields');
const passwordFields = document.getElementById('passwordFields');

function setType(type) {
  selectedType = type;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.type === type));

  customerFields.style.display = type === 'Customer' ? 'block' : 'none';
  stallOwnerFields.style.display = type === 'StallOwner' ? 'block' : 'none';
  operatorFields.style.display = type === 'Operator' ? 'block' : 'none';
  // Customers have no password column in the database, so no password
  // fields for them. Stall owners and operators both need one.
  passwordFields.style.display = type === '....' ? 'none' : 'block';

  hideBanners();
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => setType(tab.dataset.type));
});

function showBanner(el, message) {
  el.textContent = message;
  el.classList.add('show');
}

function hideBanners() {
  document.getElementById('errorBanner').classList.remove('show');
  document.getElementById('successBanner').classList.remove('show');
}

function buildPayload() {
  const name = document.getElementById('fieldName').value.trim();

  if (selectedType === 'Customer') {
    return {
      name,
      contactNo: document.getElementById('custContactNo').value.trim() || null,
      email: document.getElementById('custEmail').value.trim() || null,
      password: document.getElementById('password').value
    };
  }

  if (selectedType === 'StallOwner') {
    return {
      name,
      nric: document.getElementById('ownerNric').value.trim(),
      contactNo: document.getElementById('ownerContactNo').value.trim(),
      email: document.getElementById('ownerEmail').value.trim(),
      password: document.getElementById('password').value
    };
  }

  // Operator
  return {
    name,
    contactPerson: document.getElementById('opContactPerson').value.trim(),
    email: document.getElementById('opEmail').value.trim(),
    password: document.getElementById('password').value
  };
}

function validate() {
  const name = document.getElementById('fieldName').value.trim();
  if (!name) {
    return 'Please enter your name.';
  }

  if (selectedType === 'Customer') {
    const contactNo = document.getElementById('custContactNo').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    if (!contactNo && !email) {
      return 'Please provide at least a contact number or an email.';
    }

    return null;
  }

  if (selectedType === 'StallOwner') {
    const nric = document.getElementById('ownerNric').value.trim();
    const contactNo = document.getElementById('ownerContactNo').value.trim();
    const email = document.getElementById('ownerEmail').value.trim();
    if (!nric || !contactNo || !email) {
      return 'Please fill in NRIC, contact number, and email.';
    }
  }

  if (selectedType === 'Operator') {
    const contactPerson = document.getElementById('opContactPerson').value.trim();
    const email = document.getElementById('opEmail').value.trim();
    if (!contactPerson || !email) {
      return 'Please fill in contact person and email.';
    }
  }

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (!password || !confirmPassword) {
    return 'Please enter and confirm your password.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
}

document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  hideBanners();

  const validationError = validate();
  if (validationError) {
    showBanner(document.getElementById('errorBanner'), validationError);
    return;
  }

  const btn = document.getElementById('signupBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const response = await fetch(`${API_BASE}/${selectedType}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload())
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Could not create your account (status ${response.status}).`);
    }

    showBanner(document.getElementById('successBanner'), 'Account created. Redirecting to login...');
    setTimeout(() => { window.location.href = '/login'; }, 1200);

  } catch (error) {
    showBanner(document.getElementById('errorBanner'), error.message || 'Something went wrong creating your account.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create account';
  }
});

setType('Customer');