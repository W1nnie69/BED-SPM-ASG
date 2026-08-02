function showBanner(el, message) {
  el.textContent = message;
  el.classList.add('show');
}

function hideBanner(el) {
  el.classList.remove('show');
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const errorBanner = document.getElementById('errorBanner');
  hideBanner(errorBanner);

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const button = e.target.querySelector('button');

  button.disabled = true;
  button.textContent = 'Logging in...';

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed. Please check your username and password.');
    }

    const data = await response.json();

    // Most APIs send back a token here. Save it so the browser
    // remembers the user is logged in on future page loads.
    if (data.token) {
      localStorage.setItem('jwtToken', data.token);
      sessionStorage.setItem('userId', data.userId);
      sessionStorage.setItem('userType', data.userType);
    }
    console.log(response);
    // Send the user to whatever page comes after login.
    if (data.userType === "Customer") {
      window.location.href = '/order';
    } else if (data.userType === "NeaOfficer") {
      window.location.href = '/inspection';
    } else {
      window.location.href = '/dashboard';
    }


  } catch (error) {
    showBanner(errorBanner, error.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Log in';
  }

});