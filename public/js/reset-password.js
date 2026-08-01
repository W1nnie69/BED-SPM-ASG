document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');
  const button = e.target.querySelector('button');

  if (newPassword !== confirmPassword) {
    errorMessage.textContent = 'Passwords do not match. Please try again.';
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    errorMessage.textContent = 'Missing token. Please restart the password reset process.';
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    return;
  }

  button.disabled = true;
  button.textContent = 'Resetting...';

  try {
    const response = await fetch('http://localhost:3000/api/user/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token, password: newPassword })
    });

    if (!response.ok) {
      throw new Error('Could not reset password. Please try again.');
    }

    errorMessage.style.display = 'none';
    successMessage.style.display = 'block';
    document.getElementById('resetPasswordForm').reset();

  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    button.disabled = false;
    button.textContent = 'Reset password';
    return;
  }

  button.disabled = false;
  button.textContent = 'Password reset!';
  setTimeout(function() {
    window.location.href = '/login';
  }, 3500);
});