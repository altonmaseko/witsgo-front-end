let notifier = new AWN()
const finishAccountSetupButton = document.querySelector("#finish-account-setup-button");

//access email from ...url/?email=...
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');

import { clientUrl, serverUrl } from "./constants.js";
const userRole = document.querySelector("#role-dropdown");
const onWheelChair = document.querySelector("#wheel-chair-dropdown");
const errorMessage = document.querySelector(".error-message");

userRole.addEventListener("input", () => { errorMessage.style.display = "none"; });
onWheelChair.addEventListener("input", () => { errorMessage.style.display = "none"; });

finishAccountSetupButton.addEventListener("click", async () => {

    // Validation ========================================

    if (userRole.value === "" ||
        onWheelChair.value === "") {
        errorMessage.style.display = "block";
        errorMessage.textContent = "Please fill in all fields.";
        return;
    }

    // End Validation ========================================

    const body = {
        role: userRole.value,
        onWheelChair: onWheelChair.value,
    }

    try {
        let response = await axios.put(`${serverUrl}/user/update/${email}`, body, { withCredentials: true });
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        // alert("An error occurred. Please try again later");

        notifier.alert("An error occurred. Please try again later",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Error Occured' }
            });

        await new Promise(r => setTimeout(r, 4000));

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

// //on page fully loaded
// document.addEventListener("DOMContentLoaded", async () => {
//     // Get user to update local storage
//     let response
//     try {
//         response = await axios.get(`${serverUrl}/user/${email}`);
//         console.log(response.data);
//     } catch (error) {
//         console.log(error.message);
//         alert("An error occurred. Please try again later");
//         window.location.href = `${clientUrl}`;
//     }

//     // Set local storage
//     localStorage.clear();
//     localStorage.setItem("firstName", response.data.firstName);
//     localStorage.setItem("lastName", response.data.lastName);
//     localStorage.setItem("picture", response.data.picture);
//     localStorage.setItem("onWheelChair", response.data.onWheelChair);
//     localStorage.setItem("age", response.data.age);
//     localStorage.setItem("email", response.data.email);
//     localStorage.setItem("role", response.data.role);
// });