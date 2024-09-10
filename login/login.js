const loginWithGoogleButton = document.getElementById('login-with-google-button');

import { clientUrl, serverUrl } from "../constants.js";

loginWithGoogleButton.addEventListener('click', () => {
    const homepage = encodeURIComponent(`${clientUrl}/Real Time Tracking/real-time-tracking.html`);
    window.location.href = `${serverUrl}/auth/google?redirect=${homepage}`;
});
