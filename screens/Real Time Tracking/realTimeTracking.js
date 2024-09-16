// FROM STUDENT PERSPECTIVE ****************************************************


// get the user and get a property
const user = JSON.parse(localStorage.getItem("user"));
console.log("User from local storage", user);

import { clientUrl, serverUrl } from "../constants.js";

const mapContainer = document.querySelector('.map-container');

const humanIconDiv = document.createElement('div');
humanIconDiv.innerHTML = `<img src="./map_icons/human_circle_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

let map;
let currentLocationMarker;
let vehicleMarkers = {};

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
        title: "I am here",
        content: humanIconDiv.cloneNode(true)
    });


}

// function to calculate the route between two points and display it on the map
async function calculateAndDisplayRoute(start, end) {

    const directionsService = new DirectionsService();
    const directionsRenderer = new DirectionsRenderer({
        polylineOptions: {
            strokeColor: 'lime', // set the color
            strokeWeight: 5 // set the width
        }
    });

    directionsRenderer.setMap(map);

    directionsService.route({
        origin: start,
        destination: end,
        travelMode: 'WALKING',

    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
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

// keep track of the user's location as they move
navigator.geolocation.watchPosition((position) => {
    console.log("Current Location:", position.coords.latitude, position.coords.longitude);

    const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    // Check if the marker exists, if yes, update its position, else create it
    if (currentLocationMarker) {
        currentLocationMarker.position = newPosition;
    } else {
        // Create the marker for the first time
        currentLocationMarker = new AdvancedMarkerElement({
            map: map,
            position: newPosition,
            title: "I am here!!",
        });
    }

    // Optionally, update the map center as well
    // map.setCenter(newPosition);

}, (error) => {
    console.log("Could not get location:", error);
}, {
    enableHighAccuracy: true,
    timeout: 10000, // if cant get location within 5 seconds, return an error
    maximumAge: 10000
});

initMap();


// SOCKETS ========================================

const busRoom = "bus-driver";
const campusControlRoom = "campus-control";
const campusSecurityRoom = "campus-security";

const witsBusCheck = document.querySelector(".wits-bus-check");
const campusControlBusCheck = document.querySelector(".campus-control-bus-check");
const campusSecurityCheck = document.querySelector(".campus-security-check");

const socket = io(serverUrl); // a connection to the server

socket.on("connect", () => {
    console.log(`You are connected with ID: ${socket.id}`);
})


const busIconDiv = document.createElement('div');
busIconDiv.innerHTML = `<img src="./map_icons/bus_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

const securityIconDiv = document.createElement('div');
securityIconDiv.innerHTML = `<img src="./map_icons/security_car_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

const campusControlIconDiv = document.createElement('div');
campusControlIconDiv.innerHTML = `<img src="./map_icons/campus_control_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

socket.on("server-to-client", data => {
    console.log("Vehicle Location Update:", data);

    const vehicleId = data.id;

    let vehicleMarker;
    if (data.userRole == 'bus-driver') {
        vehicleMarker = busIconDiv.cloneNode(true);
    } else if (data.userRole == 'campus-security') {
        vehicleMarker = securityIconDiv.cloneNode(true);
    } else if (data.userRole == 'campus-control') {
        vehicleMarker = campusControlIconDiv.cloneNode(true);
    }

    // If the vehicle does not exist, create it
    if (!vehicleMarkers[vehicleId]) {
        vehicleMarkers[vehicleId] = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: data.message, // Set initial position from the server data
            title: `Bus ${vehicleId}`,
            content: vehicleMarker
        });
    } else {
        // If the busMarker already exists, just update its position
        vehicleMarkers[vehicleId].position = data.message;
    }

})

witsBusCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');

    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", busRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    } else {
        socket.emit("leave-room", busRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    }
});

campusControlBusCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');

    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", campusControlRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    } else {
        socket.emit("leave-room", campusControlRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    }
});

campusSecurityCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');

    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", campusSecurityRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    } else {
        socket.emit("leave-room", campusSecurityRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    }
});

// function to remove inactive bus markers
function removeInactiveBusMarkers() {
    const currentTime = Date.now();
    for (const [busId, markerInfo] of Object.entries(vehicleMarkers)) {
        if (currentTime - markerInfo.lastUpdateTime > 60000) { // Remove if no update for 1 minute
            markerInfo.marker.setMap(null);
            delete vehicleMarkers[busId];
        }
    }
}

// Call removeInactiveBusMarkers periodically
setInterval(removeInactiveBusMarkers, 60000); // Check every minute
