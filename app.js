const express = require('express');
require('dotenv').config()
const path = require('path');

const app = express();


// Mapping of simplified URLs to actual file paths
// app.use(express.static("./frontend")); handles other files.
const urlMap = {
    '/buses': '/busSchedule.html',
    '/driverpage': '/driverTracking.html',
    '/finishsetup': '/finishAccountSetup.html',
    '/navigation': '/navigation.html',
    '/profile': '/profile.html',
    '/authorize': 'registerLogin.html',
    '/tracktransport': '/realTimeTracking.html',
    '/rental': '/rental.html',
};
// END: SIMPLIFIED ROUTES

app.use(express.static('public'));

// Middleware to handle simplified URLs
app.get(Object.keys(urlMap), (req, res) => {
    const actualPath = path.join(__dirname, 'public', urlMap[req.path]);
    res.sendFile(actualPath, (err) => {
        if (err) {
            res.status(404).send('File not found');
        }
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});