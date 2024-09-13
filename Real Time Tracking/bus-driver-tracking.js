import { clientUrl, serverUrl } from "../constants.js";

// get the user and get a property
const user = JSON.parse(localStorage.getItem("user"));
console.log("User from local storage", user);

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

const witsBusRoom = "wits-bus";
const campusControlBusRoom = "campus-control-bus";
const campusSecurityRoom = "campus-security";

let roomToSend;

if (user.role == "bus-driver") {
    roomToSend = witsBusRoom;
} else if (user.role == "campus-security") {
    roomToSend = campusSecurityRoom;
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
                message: newPosition
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



