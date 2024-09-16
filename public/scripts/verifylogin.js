import { clientUrl, serverUrl } from "./constants.js";

console.log("verifylogin.js is connected");

const checkLogin = async () => {
    return;
    let response
    try {
        response = await axios.get(`${serverUrl}/verifylogin`, { withCredentials: true });
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        window.location.href = `${clientUrl}/notLoggedIn.html`;
    }

    if (!response.data.isLoggedIn) {
        console.log("User is not logged in");
        window.location.href = `${clientUrl}/notLoggedIn.html`;
        return;
    }

    // store an object in local storage, the object is in response.data.user
    localStorage.setItem("user", JSON.stringify(response.data.user.user));

    // get the user and get a property
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("User from local storage", user);

}
checkLogin();