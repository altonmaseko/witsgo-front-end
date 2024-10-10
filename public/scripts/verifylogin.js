import { clientUrl, serverUrl } from "./constants.js";

console.log("verifylogin.js is connected");

const checkLogin = async () => {

    const accessToken = localStorage.getItem("accessToken");

    let response
    try {

        response = await axios.get(`${serverUrl}/verifylogin?token=${accessToken}`, { withCredentials: true });
        console.log("Login, 200 OK", response.data);
    } catch (error) {
        console.log("Error: ", error);
        alert(`Failed to verify login. localStorage accessToken: ${accessToken}`);
        window.location.href = `${clientUrl}/authorize`;
        return;
    }

    if (!response.data.isLoggedIn) {
        console.log("User is not logged in");
        window.location.href = `${clientUrl}/authorize`;
        return;
    }

    // Set local storage
    // localStorage.clear();
    localStorage.setItem("firstName", response.data.user.user.firstName);
    localStorage.setItem("lastName", response.data.user.user.lastName);
    localStorage.setItem("picture", response.data.user.user.picture);
    localStorage.setItem("onWheelChair", response.data.user.user.onWheelChair);
    localStorage.setItem("email", response.data.user.user.email);
    localStorage.setItem("role", response.data.user.user.role);
    localStorage.setItem("userId", response.data.user.user._id);

    console.log("User from response.data.user.user", response.data.user.user);


}
checkLogin();


// PROFILE INTERACTIONS FOR ALL PAGES

document.querySelector(".profile-img")?.setAttribute("src", localStorage.getItem("picture"));
document.querySelector(".profile-img")?.addEventListener("click", () => {
    window.location.href = `${clientUrl}/profile`;
});