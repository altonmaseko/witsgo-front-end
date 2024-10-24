let notifier = new AWN()
// LOAD MAP
import { clientUrl, serverUrl } from "./constants.js";
// Show the loader
document.getElementById('map-loader').style.display = 'block';
let googleMapsApiKey;
try {
    const response = await axios.get(`${serverUrl}/api/secrets/googlemapsapikey`);
    googleMapsApiKey = response.data.googleMapsApiKey;

    // Load Google Maps
    (g => {
        var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window;
        b = b[c] || (b[c] = {});
        var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => {
            await (a = m.createElement("script"));
            e.set("libraries", [...r] + "");
            for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => h = n(Error(p + " could not load."));
            a.nonce = m.querySelector("script[nonce]")?.nonce || "";
            m.head.append(a)
        }));
        d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n))
    })({ key: googleMapsApiKey, v: "weekly" });

    // Hide the loader once the map is successfully loaded
    google.maps.__ib__ = () => {
        document.getElementById('map-loader').style.display = 'none';
        // Initialize map
        const map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -34.397, lng: 150.644 },
            zoom: 8,
        });
    };
} catch (error) {
    // Hide the loader in case of an error
    document.getElementById('map-loader').style.display = 'none';

    // Display an error notification
    notifier.alert("Failed to load Google Maps.", {
        durations: { alert: 4000 },
        labels: { alert: 'Error Occurred:' }
    });

    console.error(error);
}
// END: LOAD MAP


// get the user and get a property
const role = localStorage.getItem("role");
console.log("Role from local storage", role);

const mapContainer = document.querySelector('.map-container');
const trackingStatus = document.querySelector('.tracking-status');
const trackingLoader = document.querySelector('.tracking-loader');

let map;
let currentLocationMarker;
let allowTracking = false;
let watchID;
let lastPositionUpdateTime = 0;
let watchPositionLimit = 500; // Will execute at most once every 500ms

let currentLocation;
let circleAnimationInterval;

let GMAP, AdvancedMarkerElement, DirectionsService, DirectionsRenderer; // libraries
let librariesImported = false;
async function importLibraries() {
    if (librariesImported) return;

    GMAP = (await google.maps.importLibrary("maps")).Map;
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;
    ({ DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes"));

    librariesImported = true;
}


async function initMap() {

    await importLibraries();

    currentLocation = await getLocation();

    // The map, centered at current location
    map = new GMAP(document.querySelector(".map-container"), {
        zoom: 18,
        center: currentLocation,
        mapId: "DEMO_MAP_ID",

    });


    currentLocationMarker = new AdvancedMarkerElement({
        map: map,
        position: currentLocation,
        title: "I am here!!",

    });

}


// returns the current location of the user
function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, reject);
        } else {
            reject("Geolocation is not supported by this browser.");
        }
    });
}
initMap();

// SOCKETS ========================================
const socket = io(serverUrl); // a connection to the server

const busRoom = "bus-driver";
const campusControlRoom = "campus-control";
const campusSecurityRoom = "campus-security";

let roomToSend;

if (role == "bus-driver") {
    roomToSend = busRoom;
} else if (role == "campus-security") {
    roomToSend = campusSecurityRoom;
} else if (role == "campus-control") {
    roomToSend = campusControlRoom;
} else { // temporary, for testing
    roomToSend = busRoom;
}


socket.on("connect", () => {
    console.log(`You are connected with ID: ${socket.id}`);
})

socket.on("server-to-client", data => {
    console.log(data.message);
});
// END: SOCKETS ========================================
// Function to create an expanding circle
function createExpandingCircle() {
    let radius = 1; // Start with a very small radius
    let opacity = 0.2; // Start with a slightly transparent

    // Create a new circle at the marker's location
    const circle = new google.maps.Circle({
        strokeColor: "#0000FF",   // Blue border
        strokeOpacity: 0.1,
        strokeWeight: 2,
        fillColor: "#0000FF",     // Blue fill
        fillOpacity: 0.06,         // Transparency
        map: map,
        // center: currentLocation,
        center: currentLocationMarker.position,
        radius: radius,           // Initial radius in meters
    });

    // Animate the circle's radius to expand
    const intervalId = setInterval(() => {
        radius += 10; // Increase radius gradually
        opacity -= 0.005; // Reduce opacity gradually
        if (opacity < 0) opacity = 0; // Prevent opacity from going below 0

        circle.setRadius(radius);
        circle.setOptions({ fillOpacity: opacity });; // Make the border transparent

        // Check if the circle is too big and should be removed
        // if (radius > 1000 || !map.getBounds().contains(circle.getCenter())) {
        if (radius > 400) {
            clearInterval(intervalId); // Stop the expansion
            circle.setMap(null);       // Remove the circle from the map
        }
    }, 50); // Adjust the interval for smoother animation
}

// Function to create expanding circles periodically
function createExpandingCircles() {
    circleAnimationInterval = setInterval(() => {
        createExpandingCircle(); // Create a new expanding circle
    }, 1400); // Create a new circle every second
}


const trackMeButton = document.querySelector('#track-me-button');
trackMeButton.addEventListener('click', async () => {
    if (allowTracking) {
        trackMeButton.textContent = "Track Me";
        clearInterval(circleAnimationInterval);

        trackingStatus.textContent = "Click below when you start another journey";
        trackingLoader.style.display = "none";

        allowTracking = false;

        // Stop tracking using the watchID
        if (watchID !== undefined) {
            navigator.geolocation.clearWatch(watchID);
            console.log("Tracking Stopped!");
        }

        clearInterval(circleAnimationInterval);
        circleAnimationInterval = null;

    } else {
        if (!roomToSend) {
            // alert("You should be a bus driver, campus security or campus control to track your location.");

            notifier.alert("You should be a bus driver, campus security or campus control to track your location.",
                {
                    durations: { alert: 4000 },
                    labels: { alert: 'Error Occured' }
                });

            return;
        };
        trackMeButton.textContent = "Stop Tracking";
        trackingStatus.textContent = "you are currently being tracked...";
        trackingLoader.style.display = "block";

        allowTracking = true;

        console.log("Tracking Started!")

        createExpandingCircles();

        // Start continuous updates using watchPosition
        watchID = navigator.geolocation.watchPosition((position) => {

            const currentTime = new Date().getTime();

            if (currentTime - lastPositionUpdateTime < watchPositionLimit) {
                console.log("Position update skipped");
                return;
            }

            const newPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Send the new position to the server
            socket.emit("client-to-server", {
                room: roomToSend,
                message: newPosition,
                userRole: role
            });

            // Update marker position
            if (currentLocationMarker) {
                currentLocationMarker.position = newPosition;
            } else {
                currentLocationMarker = new AdvancedMarkerElement({
                    map: map,
                    position: newPosition,
                    title: "I am here!!"
                });
            }

            console.log("Location Updated: ", newPosition);

            // Optionally, center map
            map.setCenter(newPosition);

            lastPositionUpdateTime = currentTime;

            trackingStatus.textContent = "you are currently being tracked...";
            trackingLoader.style.display = "block";
        }, (error) => {
            console.error("Error getting location:", error);
            trackingStatus.textContent = "There was an error getting your location... resolving...";
            trackingLoader.style.display = "none";
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
        });


    }
});


// Add event listener for page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is out of focus
        clearInterval(circleAnimationInterval);
        circleAnimationInterval = null
    } else {
        // Page is in focus
        if (allowTracking) {
            createExpandingCircles();
        }
    }
});