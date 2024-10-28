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
        // Initialize map after loading
        initMap();
    };
} catch (error) {
    // Hide the loader in case of an error
    document.getElementById('map-loader').style.display = 'none';
    notifier.alert("Failed to load Google Maps.", {
        durations: { alert: 4000 },
        labels: { alert: 'Error Occurred:' }
    });
    console.error(error);
}

// Add marker type tracking
let currentMarkerType = 0; // 0: bus, 1: campus control, 2: campus security
const markerTypes = ['bus', 'campus-control', 'campus-security'];

// Timer stuff
let lastUpdateTime = Date.now();

function checkForUpdates() {
    if (Date.now() - lastUpdateTime > 5000) {
        if (!witsBusCheck.classList.contains('checked')
            && !campusControlBusCheck.classList.contains('checked')
            && !campusSecurityCheck.classList.contains('checked')) {
            updateMessage.textContent = "Please select a vehicle to track";
            lastUpdateTime = Date.now();
        } else {
            updateMessage.textContent = "Waiting for vehicle updates...";
        }
    }
}
setInterval(checkForUpdates, 1000);

// Get user role
const role = localStorage.getItem("role");

// DOM Elements
const mapContainer = document.querySelector('.map-container');
const updateMessage = document.querySelector('.update-message');
const updateMessageContainer = document.querySelector('.update-message-container');

// Create marker icons
const busIconDiv = document.createElement('div');
busIconDiv.innerHTML = `<img src="./icons/bus_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

const campusControlIconDiv = document.createElement('div');
campusControlIconDiv.innerHTML = `<img src="./icons/campus_control_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

const securityIconDiv = document.createElement('div');
securityIconDiv.innerHTML = `<img src="./icons/security_car_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

const humanIconDiv = document.createElement('div');
humanIconDiv.innerHTML = `<img src="./icons/human_circle_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

// Map variables
let map;
let currentLocationMarker;
let vehicleMarkers = {};
let clickMarkers = [];

// Google Maps libraries
let GMAP, AdvancedMarkerElement, DirectionsService, DirectionsRenderer;
let librariesImported = false;

async function importLibraries() {
    if (librariesImported) return;

    GMAP = (await google.maps.importLibrary("maps")).Map;
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;
    ({ DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes"));

    librariesImported = true;
}

function getMarkerIcon(type) {
    switch (type) {
        case 'bus':
            return busIconDiv.cloneNode(true);
        case 'campus-control':
            return campusControlIconDiv.cloneNode(true);
        case 'campus-security':
            return securityIconDiv.cloneNode(true);
        default:
            return busIconDiv.cloneNode(true);
    }
}

async function initMap() {
    await importLibraries();

    const currentLocation = await getLocation();

    map = new GMAP(document.querySelector(".map-container"), {
        zoom: 18,
        center: currentLocation,
        mapId: "DEMO_MAP_ID",
    });

    currentLocationMarker = new AdvancedMarkerElement({
        map: map,
        position: currentLocation,
        title: "You are here",
        content: humanIconDiv.cloneNode(true)
    });

    // Add click listener to map
    map.addListener('click', function (event) {
        const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };

        // Create marker based on current type
        const markerType = markerTypes[currentMarkerType];
        const markerIcon = getMarkerIcon(markerType);

        const marker = new AdvancedMarkerElement({
            map: map,
            position: position,
            title: `${markerType} marker`,
            content: markerIcon
        });

        clickMarkers.push(marker);

        // Update marker type for next click
        currentMarkerType = (currentMarkerType + 1) % markerTypes.length;
    });
}

async function calculateAndDisplayRoute(start, end) {
    const directionsService = new DirectionsService();
    const directionsRenderer = new DirectionsRenderer({
        polylineOptions: {
            strokeColor: 'lime',
            strokeWeight: 5
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
            notifier.alert('Directions request failed due to ' + status, {
                durations: { alert: 4000 },
                labels: { alert: 'Error Occurred:' }
            });
        }
    });
}

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

// Watch user location
navigator.geolocation.watchPosition((position) => {
    console.log("Current Location:", position.coords.latitude, position.coords.longitude);

    const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    if (currentLocationMarker) {
        currentLocationMarker.position = newPosition;
    } else {
        currentLocationMarker = new AdvancedMarkerElement({
            map: map,
            position: newPosition,
            title: "I am here!!",
        });
    }
}, (error) => {
    console.log("Could not get location:", error);
}, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 10000
});

// SOCKETS
const busRoom = "bus-driver";
const campusControlRoom = "campus-control";
const campusSecurityRoom = "campus-security";

const witsBusCheck = document.querySelector(".wits-bus-check");
const campusControlBusCheck = document.querySelector(".campus-control-bus-check");
const campusSecurityCheck = document.querySelector(".campus-security-check");

const socket = io(serverUrl);

socket.on("connect", () => {
    console.log(`You are connected with ID: ${socket.id}`);
});

socket.on("server-to-client", data => {
    console.log("Vehicle Location Update:", data);

    lastUpdateTime = Date.now();
    updateMessage.textContent = `Vehicles Updating... [${new Date().toLocaleTimeString()}]`;

    const vehicleId = data.id;
    let vehicleMarker;

    if (data.userRole == 'bus-driver') {
        vehicleMarker = busIconDiv.cloneNode(true);
    } else if (data.userRole == 'campus-security') {
        vehicleMarker = securityIconDiv.cloneNode(true);
    } else if (data.userRole == 'campus-control') {
        vehicleMarker = campusControlIconDiv.cloneNode(true);
    } else {
        vehicleMarker = busIconDiv.cloneNode(true);
    }

    if (!vehicleMarkers[vehicleId]) {
        vehicleMarkers[vehicleId] = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: data.message,
            title: `Bus ${vehicleId}`,
            content: vehicleMarker
        });
    } else {
        vehicleMarkers[vehicleId].position = data.message;
    }
});

// Event Listeners
witsBusCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');
    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", busRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`);
        });
    } else {
        socket.emit("leave-room", busRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`);
        });
    }
});

campusControlBusCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');
    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", campusControlRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`);
        });
    } else {
        socket.emit("leave-room", campusControlRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`);
        });
    }
});

campusSecurityCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');
    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", campusSecurityRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`);
        });
    } else {
        socket.emit("leave-room", campusSecurityRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`);
        });
    }
});

// Remove inactive markers
function removeInactiveBusMarkers() {
    const currentTime = Date.now();
    for (const [busId, markerInfo] of Object.entries(vehicleMarkers)) {
        if (currentTime - markerInfo.lastUpdateTime > 10000) {
            markerInfo.marker.setMap(null);
            delete vehicleMarkers[busId];
        }
    }
}

setInterval(removeInactiveBusMarkers, 10000);

updateMessageContainer.addEventListener("click", (event) => {
    if (updateMessage.textContent = "...") {
        event.currentTarget.style.width = "fit-content";
    } else {
        event.currentTarget.style.maxWidth = "40px";
        event.currentTarget.style.maxHeight = "40px";
    }
});