const goToSignInPageButton = document.querySelector("#go-to-sign-in-page-button");
const signUpButton = document.querySelector("#sign-up-button");


goToSignInPageButton.addEventListener("click", () => {
    window.location.href = "../login/login.html";
});

signUpButton.addEventListener("click", () => {
    const finishAccountSetup = encodeURIComponent('http://127.0.0.1:5501/Register Page/finishAccountSetup.html');
    window.location.href = `http://localhost:3000/auth/google?redirect=${finishAccountSetup}`;

});

