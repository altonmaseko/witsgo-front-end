const navMeBtn = document.getElementById("nav-btn");
const profileImg = document.getElementById("profile-user");
let cancelSearch = document.getElementById("cancel-search");
const inputField = document.getElementById('searchInput');



inputField.addEventListener("click",function(){
    profileImg.style.display = "None"
    cancelSearch.style.display = "flex"
})

inputField.addEventListener("focusout",function(){
    if (inputField.value==""){
        profileImg.style.display = "flex";
        cancelSearch.style.display = "None"
    }
})


profileImg.addEventListener("click",function(){
    window.location.assign("profile.html");
})

cancelSearch.addEventListener("click",function(){
    inputField.value="";
    profileImg.style.display = "flex";
    cancelSearch.style.display = "None"

})



let map;



let origin = {
    "latitude":-1,
    "longitude":-1
}


let dest = {
    "latitude":-1,
    "longitude":-1
}

let markers = []

async function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const coords = position.coords;
                resolve(coords);  // Resolve the Promise with the coordinates
            }, function(error) {
                reject(error);  // Reject the Promise if there's an error
            });
        } else {
            alert("Geolocation is not supported by this browser.");
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}


// initialize map
async function initMap(){
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { PlacesService, SearchBox } = await google.maps.importLibrary("places");

    let coords = await getLocation();
    origin["latitude"] = coords.latitude;
    origin["longitude"] = coords.longitude;

    var location = {lat: coords.latitude, lng: coords.longitude}; // default location

    map = new Map(document.getElementById("map"), {
        zoom: 15,
        center: location,
        mapId: "DEMO_MAP_ID",
    });

    //TODO might break, change back to let markers if necessary
    markers = []; // Store marker instances

    const content = document.createElement('div');
    content.classList.add('custom-marker');

    let userMarker = new AdvancedMarkerElement({
        map: map,
        position: location,
        title: "User",
        content: content,
    });

    markers.push(userMarker); // Add the user marker to the markers array


    const searchBox = new SearchBox(inputField);

    // Updates the addresses when searching
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length === 0) {
            alert('No places found for the given input.');
            return;
        }

        // Clear out the old markers by setting their map to null
        markers.forEach((marker) => {
            marker.map = null;
        });
        markers = []; // Reset the markers array

        var bounds = new google.maps.LatLngBounds(); // Move the map to the new locations

        places.forEach(function(place) {
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

            markers.push(placeMarker); // Add place marker to the markers array

            // Add the user's marker back to the array
            let userMarker = new AdvancedMarkerElement({
                map: map,
                position: {lat: origin["latitude"], lng: origin["longitude"]},
                title: "User",
                content: content,
            });

            markers.push(userMarker); // Add user marker to markers

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });

        map.fitBounds(bounds);
    });
}



navMeBtn.addEventListener("click", async function() {
    if (dest.latitude==-1 || dest.longitude==-1){
        alert("Please search some place first");
        return;
    }

    try {
        let coords = await getLocation();
        const url = "http://192.168.0.85:3000/v1/route_optimize/route_optimize";

        origin["latitude"]=coords.latitude;
        origin["longitude"]=coords.longitude;

        // origin["latitude"]=-26.0368145
        // origin["longitude"]=28.0088218


        let data = {
            "origin":origin,
            "destination":dest,
            "travelMode":"WALK"
        }

        const response = await axios.post(url, data);
        let outputData = response.data;
        const encodedPolyline = outputData.data;

        var decodedPoints = polyline.decode(encodedPolyline);

        const polylinePath = new google.maps.Polyline({
            path: decodedPoints.map(point => ({ lat: point[0], lng: point[1] })),
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        polylinePath.setMap(map);
    } catch (error) {
        console.error("Error getting location:", error);
    }
});

initMap();







