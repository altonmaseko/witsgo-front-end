const loginWithGoogleButton = document.getElementById('login-with-google-button');

loginWithGoogleButton.addEventListener('click', () => {
    const homepage = encodeURIComponent('http://127.0.0.1:5501/Real Time Tracking/real-time-tracking.html');
    window.location.href = `http://localhost:3000/auth/google?redirect=${homepage}`;
});
