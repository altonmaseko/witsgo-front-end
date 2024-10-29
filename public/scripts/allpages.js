console.log('allpages.js loaded')

import { serverUrl, clientUrl } from "./constants.js";
let email = localStorage.getItem("email");

const deleteButton = document.querySelector('#delete-button');
const logoutButton = document.querySelector('#logout-button');
const statsButton = document.querySelector('#stats-button');
const aboutButton = document.querySelector('#about-button');
const wheelChairToggle = document.querySelector('#wheelchair-toggle');

let notifier = new AWN()

// on document loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("document loaded");

    // check if user is on a wheelchair
    try {
        let userResponse = await axios.get(`${serverUrl}/user/${email}`, { withCredentials: true });
        // console.log("all pages user response: ", userResponse.data.user);
        wheelChairToggle.checked = userResponse.data.user.onWheelChair;
        localStorage.setItem("onWheelChair", userResponse.data.user.onWheelChair);
    } catch (error) {
        console.log("Error checking if user is on a wheelchair", error);
    }
});

// try {
//     wheelChairToggle.checked = localStorage.getItem("onWheelChair") === "true";
//     console.log("Wheel chair check is: ", localStorage.getItem("onWheelChair"))
// } catch (error) {
// }



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
        // alert("Something went wrong while trying to logout. You may still be logged in.");

        notifier.alert("Something went wrong while trying to logout. You may still be logged in.",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Error Occured' }
            });
        await new Promise(r => setTimeout(r, 4000));

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
        notifier.alert("Error deleting account",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Error Occured' }
            });

        console.error("Error deleting account", error);
    }
});

wheelChairToggle?.addEventListener('click', async () => {
    console.log("wheelChairToggle clicked");

    notifier.info("Updating your disability status...",
        {
            durations: { info: 2000 },
            labels: { info: 'Updating...' }
        });

    const body = {
        onWheelChair: wheelChairToggle.checked,
    }

    try {
        let response = await axios.put(`${serverUrl}/user/update/${email}`, body, { withCredentials: true });
        console.log("Wheel chair check is: ", wheelChairToggle.checked)
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        alert("Something went wrong updating your disabiltiy status. Please try again later");
    }
});

// THEMES

// // Function to switch to dark mode
// function enableDarkMode() {
//     document.documentElement.style.setProperty('--primary-color', '#5E3B76');
//     document.documentElement.style.setProperty('--background-color', '#2C2C2C');
//     document.documentElement.style.setProperty('--bottom-nav-color', '#1E1E1E');
//     document.documentElement.style.setProperty('--text-color', '#ffffff');
//     localStorage.setItem('theme', 'dark');
// }

// // Function to switch to light mode
// function enableLightMode() {
//     document.documentElement.style.setProperty('--primary-color', '#23527c');
//     document.documentElement.style.setProperty('--background-color', '#ffffff');
//     document.documentElement.style.setProperty('--bottom-nav-color', '#E0DDDD');
//     document.documentElement.style.setProperty('--text-color', '#000000');
//     localStorage.setItem('theme', 'light');
// }

// function loadTheme() {
//     const theme = localStorage.getItem('theme');
//     if (theme === 'dark') {
//         enableDarkMode();
//         console.log('dark mode enabled')
//     } else {
//         enableLightMode();
//         console.log('light mode enabled')
//     }
// }

// document.querySelector('.dark-theme-button').addEventListener('click', (event) => {
//     enableDarkMode()
// })

// document.querySelector('.light-theme-button').addEventListener('click', (event) => {
//     enableLightMode()
// })

// window.addEventListener('DOMContentLoaded', loadTheme);


// Function to switch to dark mode
function enableDarkMode() {
    document.documentElement.style.setProperty('--primary-color', '#5E3B76');
    document.documentElement.style.setProperty('--background-color', '#2C2C2C');
    document.documentElement.style.setProperty('--bottom-nav-color', '#1E1E1E');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
    localStorage.setItem('theme', 'dark');
}

// Function to switch to light mode
function enableLightMode() {
    document.documentElement.style.setProperty('--primary-color', '#23527c');
    document.documentElement.style.setProperty('--background-color', '#ffffff');
    document.documentElement.style.setProperty('--bottom-nav-color', '#E0DDDD');
    document.documentElement.style.setProperty('--text-color', '#000000');
    localStorage.setItem('theme', 'light');
}

// Additional theme functions
function enableMonkeyTheme() {
    document.documentElement.style.setProperty('--primary-color', '#8B4513');
    document.documentElement.style.setProperty('--background-color', '#F5DEB3');
    document.documentElement.style.setProperty('--bottom-nav-color', '#CD853F');
    document.documentElement.style.setProperty('--text-color', '#2F4F4F');
    localStorage.setItem('theme', 'monkey');
}

function enablePinkParadiseTheme() {
    document.documentElement.style.setProperty('--primary-color', '#FF69B4');
    document.documentElement.style.setProperty('--background-color', '#FFF0F5');
    document.documentElement.style.setProperty('--bottom-nav-color', '#FFC0CB');
    document.documentElement.style.setProperty('--text-color', '#8B0000');
    localStorage.setItem('theme', 'pinkParadise');
}

function enableForestGreeneryTheme() {
    document.documentElement.style.setProperty('--primary-color', '#2E8B57');
    document.documentElement.style.setProperty('--background-color', '#F0FFF0');
    document.documentElement.style.setProperty('--bottom-nav-color', '#556B2F');
    document.documentElement.style.setProperty('--text-color', '#2F4F4F');
    localStorage.setItem('theme', 'forestGreenery');
}

function enableOceanBreezeTheme() {
    document.documentElement.style.setProperty('--primary-color', '#4682B4');
    document.documentElement.style.setProperty('--background-color', '#E0FFFF');
    document.documentElement.style.setProperty('--bottom-nav-color', '#B0E0E6');
    document.documentElement.style.setProperty('--text-color', '#2F4F4F');
    localStorage.setItem('theme', 'oceanBreeze');
}

// Function to load the saved theme on page load
function loadTheme() {
    const theme = localStorage.getItem('theme');
    switch (theme) {
        case 'dark':
            enableDarkMode();
            console.log('Dark mode enabled');
            break;
        case 'monkey':
            enableMonkeyTheme();
            console.log('Monkey theme enabled');
            break;
        case 'pinkParadise':
            enablePinkParadiseTheme();
            console.log('Pink Paradise theme enabled');
            break;
        case 'cyberNeon':
            enableCyberNeonTheme();
            console.log('Cyber Neon theme enabled');
            break;
        case 'forestGreenery':
            enableForestGreeneryTheme();
            console.log('Forest Greenery theme enabled');
            break;
        case 'oceanBreeze':
            enableOceanBreezeTheme();
            console.log('Ocean Breeze theme enabled');
            break;
        default:
            enableLightMode();
            console.log('Light mode enabled');
            break;
    }
}

// Event listeners for theme buttons
document.querySelector('.dark-theme-button')?.addEventListener('click', enableDarkMode);
document.querySelector('.light-theme-button')?.addEventListener('click', enableLightMode);
document.querySelector('.monkey-theme-button')?.addEventListener('click', enableMonkeyTheme);
document.querySelector('.pink-paradise-button')?.addEventListener('click', enablePinkParadiseTheme);
document.querySelector('.forest-greenery-button')?.addEventListener('click', enableForestGreeneryTheme);
document.querySelector('.ocean-breeze-button')?.addEventListener('click', enableOceanBreezeTheme);

// Load the saved theme when the page loads
window.addEventListener('DOMContentLoaded', loadTheme);
