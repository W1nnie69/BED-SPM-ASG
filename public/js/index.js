// ---------------------------------------------------------------
    // If someone's already logged in (same jwtToken/userType pattern
    // used across dashboard.html, profile.html, and order.js), skip
    // the landing page and send them straight to where they belong.
    // Otherwise, show the three entry options below.
    // ---------------------------------------------------------------
    const jwtToken = localStorage.getItem('jwtToken');
    const userType = sessionStorage.getItem('userType');

    if (jwtToken && (userType === 'StallOwner' || userType === 'Operator')) {
      window.location.href = '/dashboard';
    } else if (jwtToken && userType === 'Customer') {
      window.location.href = '/order';
    } else {
      document.getElementById('subtitle').textContent = 'Manage stalls, book rentals, or order your next meal';
      document.getElementById('options').style.display = 'flex';
    }