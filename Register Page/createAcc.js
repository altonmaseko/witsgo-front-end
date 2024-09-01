// Get elements
const signupBtn = document.getElementById("signupBtn");
const authPopup = document.getElementById("authPopup");
const closeBtn = document.querySelector(".popup .close");
const approveBtn = document.getElementById("approveBtn");

// Show the authentication popup when Sign Up button is clicked
signupBtn.addEventListener("click", function() {
    authPopup.style.display = "block";
});

// Close the popup when the close button (×) is clicked
closeBtn.addEventListener("click", function() {
    authPopup.style.display = "none";
});
document.getElementById("signupForm").addEventListener("submit", function(event) {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        event.preventDefault(); // Prevent form submission
    }
});

// Approve button functionality
approveBtn.addEventListener("click", function() {
    const authCode = document.getElementById("authCode").value;
    if (authCode) {
        alert("Auth code " + authCode + " approved!");
        authPopup.style.display = "none";
        // Further actions like form submission can be added here
    } else {
        alert("Please enter the authentication code.");
    }
});

// Close the popup if the user clicks outside of the popup content
window.addEventListener("click", function(event) {
    if (event.target == authPopup) {
        authPopup.style.display = "none";
    }
});
