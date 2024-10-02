const deleteButton = document.querySelector('#delete-button');
const logoutButton = document.querySelector('#logout-button');
const statsButton = document.querySelector('#stats-button');
const aboutButton = document.querySelector('#about-button');

import { serverUrl, clientUrl } from "./constants.js";
let email = localStorage.getItem("email");

const clearSiteData = () => {

    console.log("clearSiteData()")

    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Clear cache and reload (works in some browsers)
    if (window.caches) {
        caches.keys().then(function (names) {
            for (let name of names)
                caches.delete(name);
        });
    }
}

aboutButton?.addEventListener('click', () => {
    console.log("about button clicked");
    window.location.href = `${clientUrl}/about`;
});

logoutButton?.addEventListener('click', async () => {
    console.log("logout button clicked");

    try {
        let response = await axios.post(`${serverUrl}/logout`, {}, { withCredentials: true });
        clearSiteData();
        window.location.href = `${clientUrl}`;
    } catch (error) {
        alert("Something went wrong while trying to logout. You may still be logged in.");
        window.location.href = `${clientUrl}`;
        console.error("Error logging out", error);
    }
});

deleteButton?.addEventListener('click', async () => {
    console.log("delete button clicked");

    if (!confirm("Are you sure you want to delete your account?")) {
        return;
    }

    try {
        let response = await axios.delete(`${serverUrl}/user/${email}`, { withCredentials: true });
        clearSiteData();
        window.location.href = `${clientUrl}`;
    } catch (error) {
        alert("Error deleting account");
        console.error("Error deleting account", error);
    }
});

