import { clientUrl, serverUrl } from "./constants.js";

console.log("verifylogin.js is connected");

const checkLogin = async () => {
    let response
    try {
        response = await axios.get(`${serverUrl}/verifylogin`, { withCredentials: true });
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        window.location.href = `${clientUrl}/registerLogin.html`;
    }

    if (!response.data.isLoggedIn) {
        console.log("User is not logged in");
        window.location.href = `${clientUrl}/registerLogin.html`;
        return;
    }

    localStorage.deleteItem("user");
    localStorage.setItem("user", JSON.stringify(response.data.user.user));
    // get the user and get a property
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("User from local storage", user);

}
checkLogin();