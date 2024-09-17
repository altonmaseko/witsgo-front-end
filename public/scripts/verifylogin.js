import { clientUrl, serverUrl } from "./constants.js";

console.log("verifylogin.js is connected");

const checkLogin = async () => {
    let response
    try {
        response = await axios.get(`${serverUrl}/verifylogin`, { withCredentials: true });
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        alert("Failed to authenticate your session. Please log in again.");
        window.location.href = `${clientUrl}/registerLogin.html`;
    }

    if (!response.data.isLoggedIn) {
        console.log("User is not logged in");
        window.location.href = `${clientUrl}/registerLogin.html`;
        return;
    }

    localStorage.removeItem("user");
    localStorage.setItem("user", JSON.stringify(response.data.user.user));
    localStorage.setItem("email", response.data.user.user.email);
    localStorage.setItem("role", response.data.user.user.role);
}
checkLogin();