// LOAD MAP
import { clientUrl, serverUrl } from "./constants.js";
let googleMapsApiKey;
try {
    const response = await axios.get(`${serverUrl}/api/secrets/googlemapsapikey`);
    googleMapsApiKey = response.data.googleMapsApiKey;
    console.log("Google Maps API Key: ", googleMapsApiKey);
} catch (error) {
    alert("Failed to load Google Maps.");
    console.error(error);
}

(g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })
    ({ key: googleMapsApiKey, v: "weekly" });
// END: LOAD MAP


// get the user and get a property
const role = localStorage.getItem("role");
console.log("Role from local storage", role);

const mapContainer = document.querySelector('.map-container');

let map;
let currentLocationMarker;
let allowTracking = false;
let watchID;
let lastPositionUpdateTime = 0;
let watchPositionLimit = 500; // Will execute at most once every 500ms

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

    const currentLocation = await getLocation();

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
}


socket.on("connect", () => {
    console.log(`You are connected with ID: ${socket.id}`);
})

socket.on("server-to-client", data => {
    console.log(data.message);
});
// END: SOCKETS ========================================

const trackMeButton = document.querySelector('#track-me-button');
trackMeButton.addEventListener('click', async () => {
    if (allowTracking) {
        trackMeButton.textContent = "Track Me";
        allowTracking = false;

        // Stop tracking using the watchID
        if (watchID !== undefined) {
            navigator.geolocation.clearWatch(watchID);
            console.log("Tracking Stopped!");
        }
    } else {
        if (!roomToSend) {
            alert("You should be a bus driver, campus security or campus control to track your location.");
            return;
        };
        trackMeButton.textContent = "Stop Tracking";
        allowTracking = true;

        console.log("Tracking Started!")

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
        }, (error) => {
            console.error("Error getting location:", error);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
        });


    }
});



