const mapContainer = document.querySelector('.map-container');

let map;
let currentLocationMarker;
let allowTracking = false;

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

// keep track of the user's location as they move
navigator.geolocation.watchPosition((position) => {

    if (!allowTracking) return;

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
    maximumAge: 1000
});

initMap();

const trackMeButton = document.querySelector('#track-me-button');
trackMeButton.addEventListener('click', async () => {
    if (allowTracking) {
        trackMeButton.textContent = "Track Me";
        allowTracking = false;
    } else {
        trackMeButton.textContent = "Stop Tracking";
        allowTracking = true;
    }
});

