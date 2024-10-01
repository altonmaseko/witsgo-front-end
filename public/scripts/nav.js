import { clientUrl, serverUrl } from "./constants.js";
const navMeBtn = document.getElementById("nav-btn");
const profileImg = document.getElementById("profile-user");
let cancelSearch = document.getElementById("cancel-search");
const searchInputField = document.getElementById('search-input');
const directionsTextArea = document.getElementById("directions-text");
const filter = document.getElementById("filterType");

let polylinePath = null;
let lastResponse = null;
let userLocation = null;

let map;

let origin = {
    "latitude": -1,
    "longitude": -1
}

let dest = {
    "latitude": -1,
    "longitude": -1
}

let routeID = null;
let APIMarkers = [];
let APIMarkersInfo = [];
let userMarker = null;
let searchedMarker = null;
let zoomedOut = false;
let navigationStarted = false;
let searchedPlace = false;



searchInputField.addEventListener("click", function () {
    profileImg.style.display = "None"
    cancelSearch.style.display = "flex"
})

searchInputField.addEventListener("focusout", function () {
    if (searchInputField.value == "") {
        profileImg.style.display = "flex";
        cancelSearch.style.display = "None"
    }
})

cancelSearch.addEventListener("click", function () {
    searchInputField.value = "";
    profileImg.style.display = "flex";
    cancelSearch.style.display = "None";
    directionsTextArea.innerHTML = "";

    if (polylinePath) {
        polylinePath.setMap(null);
    }
})

navMeBtn.addEventListener("click", async function () {
    if (navMeBtn.textContent == "Stop Navigation") {
        if (lastResponse == null) {
            return;
        }
        lastResponse = null;
        showMarkersOnMap()
        resetNavigationState();
        await insertNavigationHistory()
        return;
    } else {
        if (!searchedPlace) {
            return;
        }

        if (dest.latitude == -1 || dest.longitude == -1) {
            alert("Please search some place first");
            return;
        }
        navMeBtn.textContent = "Stop Navigation";

        if (searchedMarker != null) {
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

            let placeMarker = new AdvancedMarkerElement({
                map: map,
                position: searchedMarker.location,
                title: searchedMarker.name,
            });

            searchedMarker = placeMarker;
        }
        try {
            hideMarkersOnmap()
            filter.value = "none"

            const response = await getOptimizedRoute();

            let outputData = response.data;
            lastResponse = outputData;

            const encodedPolyline = outputData.data["polyline"];
            // const legs = outputData.data["legs"];
            // console.log(legs);
            var decodedPoints = polyline.decode(encodedPolyline);
            drawPolyline(decodedPoints);

            navigationStarted = true;

            const insertedData = await insertRoute(encodedPolyline);
            insertedData.data.data.success

            if (insertedData.data.data.success == true) {
                routeID = insertedData.data.data.data.route_id;
            } else {
                routeID = null;
            }
        } catch (error) {
            console.error("Error getting location:", error);
        }
    }
})

filter.addEventListener("change", () => {
    let filterBy = filter.value;

    if (filterBy == "all") {
        APIMarkers.forEach((element) => {
            element.map = map;
        })
    } else {
        for (let i = 0; i < APIMarkers.length; i++) {
            let info = APIMarkersInfo[i];
            let marker = APIMarkers[i];

            if (info.type == filterBy) {
                marker.map = map;
            } else {
                marker.map = null;
            }
        }
    }
})

function showMarkersOnMap() {
    for (let i = 0; i < APIMarkers.length; i++) {
        let marker = APIMarkers[i];
        marker.map = map;
    }
}

function hideMarkersOnmap() {
    for (let i = 0; i < APIMarkers.length; i++) {
        let marker = APIMarkers[i];
        marker.map = null;
    }
}

async function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const coords = position.coords;
                resolve(coords);  // Resolve the Promise with the coordinates
            }, function (error) {
                reject(error);  // Reject the Promise if there's an error
            });
        } else {
            alert("Geolocation is not supported by this browser.");
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}


function addWheelchairMarker(element, AdvancedMarkerElement) {
    let newMarker = {
        id: element._id,
        name: element.name,
        wheelchair_friendly: element.wheelchair_friendly,
        ramp_available: element.ramp_available,
        elevator_nearby: element.elevator_nearby,
        type: "wheelchair",
        location: { lat: element.latitude, lng: element.longitude },
    };

    APIMarkersInfo.push(newMarker);

    let newContent = document.createElement('div');
    newContent.classList.add("wheelchair-marker");

    let newAdvancedMarker = new AdvancedMarkerElement({
        map: map,
        position: newMarker.location,
        title: newMarker.building_name,
        content: newContent
    });

    APIMarkers.push(newAdvancedMarker);

    let infoWindow = new google.maps.InfoWindow({
        content: `<h3>${newMarker.name}</h3><p>Wheelchair Friendly:${newMarker.wheelchair_friendly}</p>`, // HTML content
    });

    newAdvancedMarker.addListener("click", () => {
        infoWindow.open({
            anchor: newAdvancedMarker, // Attach to the marker
            map, // Open on the map
            shouldFocus: false,
        });
    });
}

function addMarkerToMap(element, AdvancedMarkerElement) {
    let newMarker = {
        id: element._id,
        building_name: element.building_name,
        campus: element.campus[0],
        type: element.type[0],
        code: element.code,
        location: { lat: element.latitude, lng: element.longitude },
        building_id: element.building_id
    };

    APIMarkersInfo.push(newMarker);

    let newContent = document.createElement('div');
    newContent.classList.add(newMarker.type + '-marker');


    let newAdvancedMarker = new AdvancedMarkerElement({
        map: map,
        position: newMarker.location,
        title: newMarker.building_name,
        content: newContent
    });


    APIMarkers.push(newAdvancedMarker);

    let newCodeInsert = "None";
    if (newMarker.code != null) {
        if (newMarker.code.length != 0) {
            newCodeInsert = newMarker.code;
        }
    }

    let infoWindow = new google.maps.InfoWindow({
        content: `
                    <div style="font-family: Arial, sans-serif; text-align: center; position: relative; padding-bottom:30px">
                        <h3 style="margin: 0; font-size: 16px; color: #333; letter-spacing: 1px; padding:5px">
                            ${newMarker.building_name}
                        </h3>
                        <p style="margin: 5px 0 0; font-size: 14px; font-weight: bold; color: #777;">
                            Code: <span> ${newCodeInsert}</span>
                        </p>
                    </div>
                `,
    });


    newAdvancedMarker.addListener("click", () => {
        infoWindow.open({
            anchor: newAdvancedMarker,
            map: map,
            shouldFocus: true,
        });
        dest["latitude"] = newMarker.location.lat;
        dest["longitude"] = newMarker.location.lng;
        searchedPlace = true;
        searchedMarker = newMarker
        setTimeout(function () {
            infoWindow.close();
        }, 2500);

    });
}

function resetNavigationState() {
    navMeBtn.textContent = "Navigate Me";
    searchInputField.value = "";
    directionsTextArea.innerHTML = "";
    if (polylinePath) {
        polylinePath.setMap(null);
    }
    filter.value = "all";
    searchedMarker.map = null;
    navigationStarted = false;
    searchedPlace = false;
    dest["latitude"] = -1;
    dest["longitude"] = -1;
}

async function getOptimizedRoute() {
    let coords = await getLocation();

    origin["latitude"] = coords.latitude;
    origin["longitude"] = coords.longitude;

    origin["latitude"] = -26.1908692;
    origin["longitude"] = 28.0271597;

    const url = serverUrl + "/v1/route_optimize/route_optimize";

    let data = {
        "origin": origin,
        "destination": dest,
        "travelMode": "WALK"
    };

    const response = await axios.post(url, data);
    return response;
}

async function insertRoute(polyline) {
    const url = serverUrl + "/v1/userRoutes/insertRoute";

    let data = {
        "user_id": "12345",
        "start_location": origin,
        "end_location": dest,
        "route_data": polyline
    };

    const response = await axios.post(url, data);
    return response;
}

async function insertNavigationHistory() {
    if (routeID == null) {
        return;
    }
    const url = serverUrl + "/v1/userRoutes/insertNavHistory";
    let data = {
        "user_id": "12345",
        "route_id": routeID
    };
    const response = await axios.post(url, data);
    return response;
}

function drawPolyline(decodedPoints) {
    if (polylinePath) {
        polylinePath.setMap(null);
    }

    polylinePath = new google.maps.Polyline({
        path: decodedPoints.map(point => ({ lat: point[0], lng: point[1] })),
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    polylinePath.setMap(map);
}

function isNum(str) {
    const regex = /^\d+,\d+$/;
    return regex.test(str);
}

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { PlacesService, SearchBox } = await google.maps.importLibrary("places");

    // let coords = await getLocation();
    // origin["latitude"] = coords.latitude;
    // origin["longitude"] = coords.longitude;

    // userLocation = {lat:coords.latitude,lng:coords.longitude};
    userLocation = { lat: -26.1908692, lng: 28.0271597 };

    map = new Map(document.getElementById("map"), {
        zoom: 17,
        center: userLocation,
        mapId: "DEMO_MAP_ID"
    });


    // Updates the addresses when searching
    map.addListener('bounds_changed', function () {
        if (map.getZoom() <= 15 && !navigationStarted) {
            zoomedOut = true;
            hideMarkersOnmap()
        } else {
            if (zoomedOut && !navigationStarted) {
                showMarkersOnMap()
                zoomedOut = false;
            }
        }
        searchBox.setBounds(map.getBounds());
    });

    const searchBox = new SearchBox(searchInputField);

    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length === 0) {
            alert('No places found for the given input.');
            return;
        }

        // Clear out the old markers by setting their map to null
        if (searchedMarker != null && searchedMarker.map != null) {
            searchedMarker.map = null;
        }

        var bounds = new google.maps.LatLngBounds(); // Move the map to the new locations

        places.forEach(function (place) {
            if (!place.geometry || !place.geometry.location) {
                console.log("Returned place contains no geometry");
                return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            dest["latitude"] = lat;
            dest["longitude"] = lng;

            // Create a new marker for the place
            let placeMarker = new AdvancedMarkerElement({
                map: map,
                position: place.geometry.location,
                title: place.name,
            });

            searchedMarker = placeMarker// Add place marker to the markers array

            const content = document.createElement('div');
            content.classList.add('custom-marker');

            // Add the user's marker back to the array
            userMarker = new AdvancedMarkerElement({
                map: map,
                position: { lat: origin["latitude"], lng: origin["longitude"] },
                title: "User",
                content: content,
            });

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
        searchedPlace = true;

    });
}

async function addMarkers() {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    let errorOccured = false;


    const content = document.createElement('div');
    content.classList.add('custom-marker');
    // content.classList.add('material-icons');
    // content.innerHTML="person_pin";
    // content.style="font-size:36px";

    userMarker = new AdvancedMarkerElement({
        map: map,
        position: userLocation,
        title: "User",
        content: content,
    });

    try {
        const res = await axios.get(serverUrl + "/v1/map/getBuildings");
        let successData = res.data.data;
        if (successData.success == false || successData == undefined) {
            console.log("Unable to get markers");
        }
        const data = res.data.data.data;
        data.forEach((element) => {
            addMarkerToMap(element, AdvancedMarkerElement);
        }
        )
    } catch (error) {
        errorOccured = true;
    }


    //wheelchairs
    try {
        const res = await axios.get(serverUrl + "/v1/accessibility/getWheelchairs");
        let successData = res.data.data;
        if (successData.success == false || successData == undefined) {
            console.log("Unable to get markers");
        }
        const data = res.data.data.data;
        data.forEach((element) => {
            addWheelchairMarker(element, AdvancedMarkerElement);
        }
        )
    } catch (error) {
        errorOccured = true;
    }


    //dining hall stuff
    try {
        const res = await axios.get("https://virtserver.swaggerhub.com/O-n-Site/CampusBites/1.0.0/restaurants");
        res.data.forEach((restaurant) => {
            let location = restaurant.location;


            if (isNum(location) == false) {
                throw Error("Invalid format")
            }


            let id = restaurant.id;
            let name = restaurant.name;
            let opening_time = restaurant.opening_time;
            let closing_time = restaurant.closing_time;
            let categories = restaurant.categories;

            categories.forEach((item) => {
                let itemName = item.name;
                let menuItems = item.menu_items

                menuItems.forEach((menuItem) => {
                    console.log(menuItem);
                    let menuItemName = menuItem.name;
                    let description = menuItem.description;
                    let price = menuItem.price;
                    let is_available = menuItem.is_available;

                })
            })

            console.log(location);
        })
    } catch (error) {
        console.log(error);
        //TODO make error shorter
    }

    if (errorOccured) {
        alert("Error getting markers");
    }
}

navigator.geolocation.watchPosition((position) => {
    // console.log("Current Location:", position.coords.latitude, position.coords.longitude);
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    origin["latitude"] = lat;
    origin["longitude"] = lng;
    if (userMarker == null) {
        return;
    }
    userMarker.position = { lat: origin["latitude"], lng: origin["longitude"] }

}, (error) => {
    console.log("Could not get location:", error);
}, {
    enableHighAccuracy: true,
    timeout: 10000, // if cant get location within 5 seconds, return an error
    maximumAge: 10000
});

async function renderPage() {
    await initMap();
    await addMarkers();
}

renderPage();
