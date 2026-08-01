document.getElementById('resetForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;

  document.getElementById('successMessage').style.display = 'block';
  document.getElementById('resetForm').reset();

  // In a real app, this page would only move forward once the user
  // clicks the reset link sent to their email. For this demo, we just
  // move to the next page after a short pause.
  try {
    const response = await fetch('http://localhost:3000/api/user/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Something went wrong...');
    }

    console.log(response);
    // Send the user to whatever page comes after login.

  } catch (error) {
    alert(error.message);
  } finally {
    setTimeout(function() {
      window.location.href = '/login';
    }, 2000);
  }
});