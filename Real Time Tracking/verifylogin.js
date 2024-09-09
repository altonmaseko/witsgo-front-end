
console.log("verifylogin.js is connected");

const checkLogin = async () => {
    let response
    try {
        response = await axios.get('http://localhost:3000/verifylogin', { withCredentials: true });
        console.log(response.data);
    } catch (error) {
        console.log(error.message);
        window.location.href = "/logintest/not-logged-in.html";
    }

    if (!response.data.isLoggedIn) {
        console.log("User is not logged in");
        window.location.href = "/logintest/not-logged-in.html";
    }

}
checkLogin();