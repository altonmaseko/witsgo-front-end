const mapContainer = document.querySelector('.map-container');

let map;
let currentLocationMarker;

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

    // const { Map } = await google.maps.importLibrary("maps");
    // const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");


    await importLibraries();

    const mslPosition = {
        lat: - 26.190301215797824, lng: 28.026853151803458
    }

    const currentLocation = await getLocation();

    // The map, centered at current location
    map = new GMAP(document.querySelector(".map-container"), {
        zoom: 18,
        center: currentLocation,
        mapId: "DEMO_MAP_ID",

    });

    // Markers -------------
    const mslMarker = new AdvancedMarkerElement({
        map: map,
        position: mslPosition,
        title: "MSL",
    });

    currentLocationMarker = new AdvancedMarkerElement({
        map: map,
        position: currentLocation,
        title: "I am here!!",

    });

    // ================================================

    // document.querySelector(".btn-show-path").addEventListener("click", async () => {
    //     calculateAndDisplayRoute(currentLocation, mslPosition);
    // });

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
    map.setCenter(newPosition);

}, (error) => {
    console.log("Could not get location:", error);
}, {
    enableHighAccuracy: true,
    timeout: 10000, // if cant get location within 5 seconds, return an error
    maximumAge: 10000
});

initMap();


// SOCKETS ========================================
const user = 'bus-driver';

const witsBusRoom = "wits-bus";
const campusControlBusRoom = "campus-control-bus";
const campusSecurityRoom = "campus-security";

const witsBusCheck = document.querySelector(".wits-bus-check");
const campusControlBusCheck = document.querySelector(".campus-control-bus-check");
const campusSecurityCheck = document.querySelector(".campus-security-check");

const socket = io("http://localhost:3000"); // a connection to the server

socket.on("connect", () => {
    console.log(`You are connected with ID: ${socket.id}`);
})

socket.on("server-to-client", data => {
    console.log(data.message);
})

// FROM STUDENT PERSPECTIVE ********************************
witsBusCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');

    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", witsBusRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    } else {
        socket.emit("leave-room", witsBusRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    }
});

campusControlBusCheck.addEventListener("click", (event) => {
    event.currentTarget.classList.toggle('checked');

    if (event.currentTarget.classList.contains("checked")) {
        socket.emit("join-room", campusControlBusRoom, (messageFromServer) => {
            console.log(`FROM SERVER: ${messageFromServer}`)
        });
    } else {
        socket.emit("leave-room", campusControlBusRoom, (messageFromServer) => {
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

// FROM BUS DRIVER PERSPECTIVE ********************************
const sendLocationEveryInterval = () => {
    const user = document.querySelector(".user").textContent;

    // if (user != 'bus-driver') return;

    setInterval(async () => {
        // const currentLocation = await getLocation();
        // console.clear();
        console.log("INTERVAL");
    }, 1000);
}

// sendLocationEveryInterval();

