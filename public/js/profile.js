// ---------------------------------------------------------------
// CONFIG
// Mirrors the same pattern as dashboard.html: JWT in localStorage,
// userId/userType in sessionStorage, and a REST route shaped like
// /api/:userType/get-profile/:id and /api/:userType/update-profile/:id.
// These two endpoints don't exist in your backend yet - you'll need
// to add them. Adjust the URLs below if you name them differently.
// ---------------------------------------------------------------
const API_BASE = 'http://localhost:3000/api';
const jwtToken = localStorage.getItem('jwtToken');

if (!jwtToken) {
  alert("Something went wrong...");
  window.location.href = '/login';
}

function getUserId() {
  return sessionStorage.getItem('userId');
}

function getUserType() {
  return sessionStorage.getItem('userType') || 'StallOwner';
}

function showBanner(el, message) {
  el.textContent = message;
  el.classList.add('show');
}

function hideBanners() {
  document.getElementById('errorBanner').classList.remove('show');
  document.getElementById('successBanner').classList.remove('show');
}

function setStatus(el, message, kind) {
  el.textContent = message;
  el.className = 'save-status' + (kind ? ' ' + kind : '');
}

// ---------------------------------------------------------------
// LOAD PROFILE
// Expects GET /api/:userType/get-profile/:id to return, for a
// Stall Owner:
//   { OwnerName, Email, OwnerContactNo, OwnerNRIC }
// or for an Operator:
//   { OperatorName, Email, ContactPerson }
// ---------------------------------------------------------------
async function loadProfile() {
  const id = getUserId();
  const userType = getUserType();
  const isOperator = userType === 'Operator';

  document.getElementById('fieldContactNoWrap').style.display = isOperator ? 'none' : 'block';
  document.getElementById('fieldContactPersonWrap').style.display = isOperator ? 'block' : 'none';
  document.getElementById('fieldNricWrap').style.display = isOperator ? 'none' : 'block';

  try {
    const response = await fetch(`${API_BASE}/user/get-profile/${id}`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    if (!response.ok) {
      throw new Error(`Could not load your profile (status ${response.status}).`);
    }

    const data = await response.json();

    document.getElementById('greetingName').textContent = isOperator
      ? (data.OperatorName || 'Your Profile')
      : (data.OwnerName || 'Your Profile');

    document.getElementById('fieldName').value = isOperator ? (data.OperatorName || '') : (data.OwnerName || '');
    document.getElementById('fieldEmail').value = data.Email || '';

    if (isOperator) {
      document.getElementById('fieldContactPerson').value = data.ContactPerson || '';
    } else {
      document.getElementById('fieldContactNo').value = data.OwnerContactNo || '';
      document.getElementById('fieldNric').value = data.OwnerNRIC || '';
    }

  } catch (error) {
    showBanner(document.getElementById('errorBanner'), error.message || 'Something went wrong loading your profile.');
  }
}

// ---------------------------------------------------------------
// SAVE PROFILE
// Sends PUT /api/:userType/update-profile/:id with a body shaped
// like { name, email, contactNo } (Stall Owner) or
// { name, email, contactPerson } (Operator). Adjust field names
// to match whatever your controller/model actually expects.
// ---------------------------------------------------------------
document.getElementById('profileForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  hideBanners();

  const id = getUserId();
  const userType = getUserType();
  const isOperator = userType === 'Operator';
  const btn = document.getElementById('saveProfileBtn');
  const status = document.getElementById('profileSaveStatus');

  const payload = {
    name: document.getElementById('fieldName').value.trim(),
    email: document.getElementById('fieldEmail').value.trim()
  };

  if (isOperator) {
    payload.contactPerson = document.getElementById('fieldContactPerson').value.trim();
  } else {
    payload.contactNo = document.getElementById('fieldContactNo').value.trim();
  }

  btn.disabled = true;
  setStatus(status, 'Saving...', '');

  try {
    const response = await fetch(`${API_BASE}/user/update-profile/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Could not save your changes (status ${response.status}).`);
    }

    setStatus(status, 'Saved', 'ok');
    showBanner(document.getElementById('successBanner'), 'Your profile has been updated.');

  } catch (error) {
    setStatus(status, 'Not saved', 'err');
    showBanner(document.getElementById('errorBanner'), error.message || 'Something went wrong saving your profile.');
  } finally {
    btn.disabled = false;
  }
});

// ---------------------------------------------------------------
// CHANGE PASSWORD
// Sends PUT /api/:userType/update-password/:id with
// { currentPassword, newPassword }. Your backend should verify
// currentPassword before allowing the change.
// ---------------------------------------------------------------
document.getElementById('passwordForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  hideBanners();

  const id = getUserId();
  const userType = getUserType();
  const btn = document.getElementById('savePasswordBtn');
  const status = document.getElementById('passwordSaveStatus');

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    setStatus(status, 'Fill in all fields', 'err');
    return;
  }

  if (newPassword !== confirmPassword) {
    setStatus(status, 'Passwords do not match', 'err');
    return;
  }

  if (newPassword.length < 8) {
    setStatus(status, 'Use at least 8 characters', 'err');
    return;
  }

  btn.disabled = true;
  setStatus(status, 'Saving...', '');

  try {
    const response = await fetch(`${API_BASE}/user/update-password/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ id, currentPassword, newPassword })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Current password is incorrect.');
      }
      throw new Error(`Could not update your password (status ${response.status}).`);
    }

    setStatus(status, 'Updated', 'ok');
    showBanner(document.getElementById('successBanner'), 'Your password has been changed.');
    document.getElementById('passwordForm').reset();

  } catch (error) {
    setStatus(status, 'Not updated', 'err');
    showBanner(document.getElementById('errorBanner'), error.message || 'Something went wrong updating your password.');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('backBtn').addEventListener('click', function() {
  window.location.href = '/dashboard';
});

document.getElementById('logoutBtn').addEventListener('click', function() {
  sessionStorage.clear();
  localStorage.removeItem('jwtToken');
  window.location.href = '/login';
});

loadProfile();