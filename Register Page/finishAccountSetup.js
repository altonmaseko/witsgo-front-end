const finishAccountSetupButton = document.querySelector("#finish-account-setup-button");

import { clientUrl, serverUrl } from "../constants.js";

finishAccountSetupButton.addEventListener("click", async () => {
    const password = document.querySelector("#password-input").value;
    const confirmPassword = document.querySelector("#verify-password-input").value;
    const userRole = document.querySelector("#role-dropdown").value;


    if (userRole === "" || password === "" || confirmPassword === "") {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    //access email from ...url/?email=...
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');

    const body = {
        password: password,
        role: userRole
    }

    try {
        let response = await axios.put(`${serverUrl}/user/update/${email}`, body);
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        alert("An error occurred. Please try again later");
        window.location.href = "./createAcc.html";
    }

    window.location.href = `${clientUrl}`;



});