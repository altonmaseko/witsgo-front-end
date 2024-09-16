const finishAccountSetupButton = document.querySelector("#finish-account-setup-button");

import { clientUrl, serverUrl } from "./constants.js";
const password = document.querySelector("#password-input");
const confirmPassword = document.querySelector("#verify-password-input");
const userRole = document.querySelector("#role-dropdown");
const degree = document.querySelector("#degree-input");
const onWheelChair = document.querySelector("#wheel-chair-dropdown");
const errorMessage = document.querySelector(".error-message");
const age = document.querySelector("#age-input");

password.addEventListener("input", () => { errorMessage.style.display = "none"; });
confirmPassword.addEventListener("input", () => { errorMessage.style.display = "none"; });
userRole.addEventListener("input", () => { errorMessage.style.display = "none"; });
degree.addEventListener("input", () => { errorMessage.style.display = "none"; });
onWheelChair.addEventListener("input", () => { errorMessage.style.display = "none"; });
age.addEventListener("input", () => { errorMessage.style.display = "none"; });

finishAccountSetupButton.addEventListener("click", async () => {

    // Validation ========================================
    const isStrong = isStrongPassword(password.value);
    if (isStrong !== true) {
        //show the message under the input instead of alerting
        errorMessage.style.display = "block";
        errorMessage.textContent = "Please enter a password with at least 8 characters, one number, one lowercase letter, one uppercase letter and one special character";
        return;
    }

    if (userRole.value === "" || password.value === "" ||
        confirmPassword.value === "" || degree.value === "" ||
        onWheelChair.value === "" || age.value === "") {
        errorMessage.style.display = "block";
        errorMessage.textContent = "Please fill in all fields.";
        return;
    }

    if (password.value !== confirmPassword.value) {
        errorMessage.style.display = "block";
        errorMessage.textContent = isStrong;
        return;
    }
    // End Validation ========================================

    //access email from ...url/?email=...
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');


    const body = {
        password: password.value,
        role: userRole.value,
        degree: degree.value,
        onWheelChair: onWheelChair.value,
        age: age.value
    }

    try {
        let response = await axios.put(`${serverUrl}/user/update/${email}`, body);
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        alert("An error occurred. Please try again later");
        window.location.href = `${clientUrl}`;
    }

    window.location.href = `${clientUrl}`;



});

const isStrongPassword = (password) => {
    // at least 8 characters
    if (password.length < 8) return "Please enter a password with at least 8 characters";

    // at least one number
    if (!/\d/.test(password)) return "Please enter a password with at least one number";

    // at least one lowercase letter
    if (!/[a-z]/.test(password)) return "Please enter a password with at least one lowercase letter";

    // at least one uppercase letter
    if (!/[A-Z]/.test(password)) return "Please enter a password with at least one uppercase letter";

    // at least one special character
    if (!/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password)) return "Please enter a password with at least one special character";

    return true;
}