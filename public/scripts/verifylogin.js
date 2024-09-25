import { clientUrl, serverUrl } from "./constants.js";

console.log("verifylogin.js is connected");

const checkLogin = async () => {
    let response
    try {
        response = await axios.get(`${serverUrl}/verifylogin`, { withCredentials: true });
        console.log("Login, 200 OK", response.data);
    } catch (error) {
        console.log(error.message);
        alert("Failed to authenticate your session. Please log in again to restore full functionality.");
        return;
    }

    if (!response.data.isLoggedIn) {
        console.log("User is not logged in");
        window.location.href = `${clientUrl}/registerLogin.html`;
        return;
    }

    // Set local storage
    localStorage.clear();
    localStorage.setItem("firstName", response.data.user.user.firstName);
    localStorage.setItem("lastName", response.data.user.user.lastName);
    localStorage.setItem("picture", response.data.user.user.picture);
    localStorage.setItem("onWheelChair", response.data.user.user.onWheelChair);
    localStorage.setItem("age", response.data.user.user.age);
    localStorage.setItem("email", response.data.user.user.email);
    localStorage.setItem("role", response.data.user.user.role);
}
// checkLogin();


// PROFILE INTERACTIONS FOR ALL PAGES

document.querySelector(".profile-img")?.setAttribute("src", localStorage.getItem("picture"));
document.querySelector(".profile-img")?.addEventListener("click", () => {
    window.location.href = `${clientUrl}/profile.html`;
});