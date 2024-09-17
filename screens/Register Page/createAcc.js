const goToSignInPageButton = document.querySelector("#go-to-sign-in-page-button");
const signUpButton = document.querySelector("#sign-up-button");

import { clientUrl, serverUrl } from "../constants.js";


goToSignInPageButton.addEventListener("click", () => {
    window.location.href = `${clientUrl}/login/login.html`;
});

signUpButton.addEventListener("click", () => {
    const finishAccountSetup = encodeURIComponent(`${clientUrl}/Register Page/finishAccountSetup.html`);
    window.location.href = `${serverUrl}/auth/google?redirect=${finishAccountSetup}`;

});

