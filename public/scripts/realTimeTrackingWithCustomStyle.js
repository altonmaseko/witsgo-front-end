// CustonMarker ========================================================


// CustomMarkerElement class that mimics AdvancedMarkerElement interface
class CustomMarkerElement {
    constructor(options) {
        this._position = options.position;
        this._map = options.map;
        this._title = options.title;

        // Create the marker
        this._marker = new google.maps.Marker({
            position: this._position,
            map: this._map,
            title: this._title,
            optimized: false // This helps with smoother updates
        });

        // Handle custom content (DOM element)
        if (options.content) {
            const scale = 1;

            // If content is a DOM element with an image
            if (options.content instanceof HTMLElement && options.content.querySelector('img')) {
                const img = options.content.querySelector('img');
                const icon = {
                    url: img.src,
                    scaledSize: new google.maps.Size(
                        parseInt(img.style.width) * scale || 40,
                        parseInt(img.style.height) * scale || 40
                    ),
                    anchor: new google.maps.Point(
                        (parseInt(img.style.width) * scale || 40) / 2,
                        (parseInt(img.style.height) * scale || 40) / 2
                    )
                };
                this._marker.setIcon(icon);
            }
        }
    }

    // Getter and setter for position to match AdvancedMarkerElement interface
    get position() {
        return this._marker.getPosition();
    }

    set position(newPosition) {
        this._marker.setPosition(newPosition);
    }

    // Map getter/setter
    get map() {
        return this._marker.getMap();
    }

    set map(newMap) {
        this._marker.setMap(newMap);
    }

    // Title getter/setter
    get title() {
        return this._marker.getTitle();
    }

    set title(newTitle) {
        this._marker.setTitle(newTitle);
    }

    // Method to update the icon
    setContent(content) {
        if (content instanceof HTMLElement && content.querySelector('img')) {
            const img = content.querySelector('img');
            const icon = {
                url: img.src,
                scaledSize: new google.maps.Size(
                    parseInt(img.style.width) || 40,
                    parseInt(img.style.height) || 40
                ),
                anchor: new google.maps.Point(
                    (parseInt(img.style.width) || 40) / 2,
                    (parseInt(img.style.height) || 40) / 2
                )
            };
            this._marker.setIcon(icon);
        }
    }

    // Method to remove marker from map
    setMap(map) {
        this._marker.setMap(map);
    }
}
// END: CustonMarker ========================================================

let notifier = new AWN()

import { retroMap, hopperMap, midnightMap, defaultMap } from "./mapStyles.js";


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

    console.log('error: ', error);
}
// END: LOAD MAP

// FROM STUDENT PERSPECTIVE ****************************************************

// Timer stuff ===
let lastUpdateTime = Date.now();

function checkForUpdates() {
    if (Date.now() - lastUpdateTime > 5000) {
        //  if none of the three are checked
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
// Start checking for updates every second
setInterval(checkForUpdates, 1000);

// END: Timer stuff

// get the user and get a property
const role = localStorage.getItem("role");


const mapContainer = document.querySelector('.map-container');

const updateMessage = document.querySelector('.update-message');
const updateMessageContainer = document.querySelector('.update-message-container');
const humanIconDiv = document.createElement('div');
humanIconDiv.innerHTML = `<img src="./icons/human_circle_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

let map;
let currentLocationMarker;
let vehicleMarkers = {};

let GMAP, AdvancedMarkerElement, DirectionsService, DirectionsRenderer; // libraries
let librariesImported = false;
async function importLibraries() {
    if (librariesImported) return;

    GMAP = (await google.maps.importLibrary("maps")).Map;
    AdvancedMarkerElement = (await google.maps.importLibrary("marker")).AdvancedMarkerElement;
    // AdvancedMarkerElement = CustomMarkerElement;
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
        mapId: "b0e8b3392ba1b941",
        // styles: retroMap,
        // styles: hopperMap,
        // styles: midnightMap,
        styles: midnightMap,

    });

    currentLocationMarker = new AdvancedMarkerElement({
        map: map,
        position: currentLocation,
        title: "You are here",
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

            notifier.alert('Directions request failed due to ' + status,
                {
                    durations: { alert: 4000 },
                    labels: { alert: 'Error Occured:' }
                });

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
busIconDiv.innerHTML = `<img src="./icons/bus_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

const securityIconDiv = document.createElement('div');
securityIconDiv.innerHTML = `<img src="./icons/security_car_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

const campusControlIconDiv = document.createElement('div');
campusControlIconDiv.innerHTML = `<img src="./icons/campus_control_marker.png" alt="custom marker" style="width: 40px; height: 40px;" />`;

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
    } else { // for testing
        vehicleMarker = busIconDiv.cloneNode(true);
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
        if (currentTime - markerInfo.lastUpdateTime > 10000) { // Remove if no update for 10 seconds
            markerInfo.marker.setMap(null);
            delete vehicleMarkers[busId];
        }
    }
}

// Call removeInactiveBusMarkers periodically
setInterval(removeInactiveBusMarkers, 10000); // Check every 10 seconds

updateMessageContainer.addEventListener("click", (event) => {
    if (updateMessage.textContent = "...") {
        event.currentTarget.style.width = "fit-content";
    } else {
        event.currentTarget.style.maxWidth = "40px";
        event.currentTarget.style.maxHeight = "40px";
    }
});
