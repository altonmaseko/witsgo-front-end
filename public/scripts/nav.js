
let notifier = new AWN()

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

//for 3rd party integration with alerts
let lastAlertID = null;
let lastAlertMarker = null;


document.getElementById('loading-spinner').style.display = 'block';

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
            // alert("Please search some place first");

            notifier.info("Please search some place first",
                {
                    durations: { info: 4000 },
                    labels: { info: 'Please Note:' }
                });

            return;
        }

        navMeBtn.textContent = "Stop Navigation";

        // if (searchedMarker != null) {
        //     const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        //     searchedMarker = new AdvancedMarkerElement({
        //         map: map,
        //         position: searchedMarker.location,
        //         title: searchedMarker.name,
        //     });
        // }

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

/**
 * Shows all the markers on the map
 */
function showMarkersOnMap() {
    for (let i = 0; i < APIMarkers.length; i++) {
        let marker = APIMarkers[i];
        marker.map = map;
    }
}

/**
 * Hides all the markers on the map
 */
function hideMarkersOnmap() {
    for (let i = 0; i < APIMarkers.length; i++) {
        let marker = APIMarkers[i];
        marker.map = null;
    }
}

/**
 * @returns the users lat and long if geolocation is allowed
 */
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
            // alert("Geolocation is not supported by this browser.");

            notifier.alert("Geolocation is not supported by this browser.",
                {
                    durations: { alert: 4000 },
                    labels: { alert: 'Error Occured:' }
                });

            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}

/**
 * Adds a wheelchair marker to the map. This needs to be a seperate function because we need to fetch
 * the markers from different endpoint
 * @param {*} element JSON including the map marker data
 * @param {*} AdvancedMarkerElement google maps Advanced Marker
 */
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

/**
 * Adds marker to the map
 * @param {*} element JSON including the map marker data
 * @param {*} AdvancedMarkerElement google maps Advanced Marker
 */
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

/**
 * Adds a new dining hall to map
 * @param {*} content 
 * @param {*} AdvancedMarkerElement 
 * @param {*} data 
 */
function addDiningHallMarker(content, AdvancedMarkerElement, data) {
    let newMarker = {
        type: "dining",
        location: { lat: data.latitude, lng: data.longitude }
    };

    APIMarkersInfo.push(newMarker);


    let newAdvancedMarker = new AdvancedMarkerElement({
        map: map,
        position: newMarker.location,
        title: data.name,
        content: content
    });


    APIMarkers.push(newAdvancedMarker);

    let infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="font-family: Arial, sans-serif; text-align: center; position: relative; padding-bottom:30px">
                <h3 style="margin: 0; font-size: 16px; color: #333; letter-spacing: 1px; padding:5px">
                    ${data.name}
                </h3>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold; color: #777;">
                    Open: ${data.opening_time} - ${data.closing_time}
                </p>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold; color: #777;">
                    Rating: ${data.rating !== undefined ? data.rating : 'None'}
                </p>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold; color: #777;">
                    Categories: ${data.categories.join(", ")}
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

/**
 * Adds alert marker to the map
 * @param {*} data 
 * @param {*} AdvancedMarkerElement 
 */
function addAlertMarker(data, AdvancedMarkerElement) {

    let newMarker = {
        type: "alert",
        location: { lat: data.latitude, lng: data.longitude },
        details: data.details
    };


    let newContent = document.createElement('div');
    newContent.classList.add("alert-marker");

    if (lastAlertMarker != null) {
        lastAlertMarker.map = null;
        lastAlertMarker = null;
    }


    let newAdvancedMarker = new AdvancedMarkerElement({
        map: map,
        position: newMarker.location,
        title: "Alert",
        content: newContent
    });

    lastAlertMarker = newAdvancedMarker;



    let infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="font-family: Arial, sans-serif; text-align: center; position: relative; padding-bottom:30px">
                <h3 style="margin: 0; font-size: 16px; color: #333; letter-spacing: 1px; padding:5px">
                    Alert
                </h3>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold; color: #777;">
                    Details: ${newMarker.details}
                </p>
            </div>
        `,
    });

    lastAlertMarker.addListener("click", () => {
        infoWindow.open({
            anchor: newAdvancedMarker,
            map: map,
            shouldFocus: true,
        });
        setTimeout(function () {
            infoWindow.close();
        }, 2500);

    })
}

/**
 * Queries the endpoint and checks if there are any new alerts
 */
async function checkForNewAlerts() {
    console.log("yo");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    let response = await axios.get("https://sdp-campus-safety.azurewebsites.net/alert");

    //if not updated in the loop, no new alerts
    let updated = false;
    let data;

    response.data.forEach((element) => {
        if (element.status != "ASSISTED") {
            let id = element.alertID;
            let long = element.lon;
            let lat = element.lat;
            let details = element.details;

            if (lastAlertID === null || id > lastAlertID) {
                lastAlertID = id;
                data = {
                    latitude: lat,
                    longitude: long,
                    details: details
                };
                updated = true;
            }
        }
    })

    //reset condis
    if (updated == false) {
        lastAlertMarker.map = null;
        lastAlertMarker = null;
        lastAlertID = null;
    } else {
        addAlertMarker(data, AdvancedMarkerElement)
    }

}

/**
 * Resets HTML DOM to pre navigation state.
 * Includes clearing fields and resetting variables
 */
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

/**
 * @returns JSON including the route data
 */
async function getOptimizedRoute() {
    let coords = await getLocation();

    origin["latitude"] = coords.latitude;
    origin["longitude"] = coords.longitude;

    // origin["latitude"] = -26.1908692;
    // origin["longitude"] = 28.0271597;

    const url = serverUrl + "/v1/route_optimize/route_optimize";

    let data = {
        "origin": origin,
        "destination": dest,
        "travelMode": "WALK"
    };

    const response = await axios.post(url, data);
    return response;
}

/**
 * 
 * @param {*} polyline 
 * @returns 
 */
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

/**
 * Inserts route data as history
 * @returns response, which includes success status
 */
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

/**
 * Puts the polyline on the google map
 * @param {*} decodedPoints Decoded polyline, which is basically a list of lat,long
 */
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


/**
 * Inits the google map using the API and calls the functions to add the initial markers
 */
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { PlacesService, SearchBox } = await google.maps.importLibrary("places");

    let coords = await getLocation();
    // origin["latitude"] = coords.latitude;
    // origin["longitude"] = coords.longitude;

    userLocation = { lat: coords.latitude, lng: coords.longitude };
    // userLocation = { lat: -26.1908692, lng: 28.0271597 };

    map = new Map(document.getElementById("map"), {
        zoom: 17,
        center: userLocation,
        mapId: "d"
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

    google.maps.event.addListenerOnce(map, 'idle', function () {
        document.getElementById('loading-spinner').style.display = 'none';
    });


    const searchBox = new SearchBox(searchInputField);

    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length === 0) {
            // alert('No places found for the given input.');

            notifier.info("No places found for the given input",
                {
                    durations: { info: 4000 },
                    labels: { info: 'Please Note:' }
                });

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

/**
 * Bigger function to call smaller functions to add the different markers to the map
 */
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
        let lat = [-26.190466695649402, -26.185630238048255, -26.18982905349109, -26.18955506524597];
        let long = [28.027754291350814, 28.025862522847362, 28.03069403720835, 28.030718660964105];
        let counter = 0;
        const res = await axios.get("https://app-rjelmm56pa-uc.a.run.app/restaurants");

        res.data.forEach((restaurant) => {

            let location = restaurant.location;
            let id = restaurant.id;
            let name = restaurant.name;
            let opening_time = restaurant.opening_time;
            let closing_time = restaurant.closing_time;
            let categories = restaurant.prefs;
            let rating = restaurant.rating;
            let restImg = restaurant.restImg;



            //Add the marker
            let data = {
                latitude: lat[counter],
                longitude: long[counter],
                name: name,
                rating: rating,
                categories: categories,
                opening_time: opening_time,
                closing_time: closing_time
            }



            let markerRes = document.createElement('div');
            markerRes.classList.add('restaurant-marker');
            markerRes.style.backgroundImage = `url("${restImg}")`

            addDiningHallMarker(markerRes, AdvancedMarkerElement, data)

            // console.log(data)
            counter += 1;
            //     let itemName = item.name;
            //     let menuItems = item.menu_items

            //     menuItems.forEach((menuItem) => {
            //         console.log(menuItem);
            //         let menuItemName = menuItem.name;
            //         let description = menuItem.description;
            //         let price = menuItem.price;
            //         let is_available = menuItem.is_available;

            //     })
            // })
        })
    } catch (error) {
        console.log(error);
    }

    //alerts
    try {

    } catch (error) {

    }

    if (errorOccured) {
        // alert("Error getting markers");

        notifier.alert("Error getting the markers",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Error Occured:' }
            });

    }
}

// navigator.geolocation.watchPosition((position) => {
//     // console.log("Current Location:", position.coords.latitude, position.coords.longitude);
//     const lat = position.coords.latitude;
//     const lng = position.coords.longitude;
//     origin["latitude"] = lat;
//     origin["longitude"] = lng;
//     if (userMarker == null) {
//         return;
//     }

//     userMarker.position = { lat: origin["latitude"], lng: origin["longitude"] }

// }, (error) => {
//     console.log("Could not get location:", error);
// }, {
//     enableHighAccuracy: true,
//     timeout: 10000, // if cant get location within 5 seconds, return an error
//     maximumAge: 10000
// });

/**
 * Renders the page
 */
async function renderPage() {
    await initMap();
    await addMarkers();
    await checkForNewAlerts();
}

renderPage();

//check for new alerts every min
//setInterval(checkForNewAlerts,300000)
