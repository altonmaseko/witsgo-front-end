const navMeBtn = document.getElementById("nav-btn");
const profileImg = document.getElementById("profile-user");
let cancelSearch = document.getElementById("cancel-search");
const inputField = document.getElementById('search-input');
const directionsTextArea = document.getElementById("directions-text");
const filter = document.getElementById("filterType");

const baseURL = "http://localhost:3000/"
// const baseURL = "https://witsgobackend.azurewebsites.net/"


let polylinePath = null;
let lastResponse = null;
let userLocation = null;

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
    cancelSearch.style.display = "None";
    directionsTextArea.innerHTML="";

    if (polylinePath) {
        polylinePath.setMap(null);
    }
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
let APIMarkers = [];
let APIMarkersInfo = [];

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
/**
 * Initializes the Google Map with user location, markers, and search functionality.
 * 
 * This function performs the following tasks:
 * - Imports necessary libraries from Google Maps API.
 * - Retrieves the user's current location.
 * - Initializes the map centered on the user's location.
 * - Adds a user marker to the map.
 * - Fetches building data from an API and adds markers for each building.
 * - Sets up a search box to allow users to search for places and update markers accordingly.
 * - Adds predefined wheelchair-accessible markers to the map.
 * 
 * @async
 * @function initMap
 * @returns {Promise<void>} A promise that resolves when the map is fully initialized.
 */
async function initMap(){
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { PlacesService, SearchBox } = await google.maps.importLibrary("places");

    // let coords = await getLocation();
    // origin["latitude"] = coords.latitude;
    // origin["longitude"] = coords.longitude;

    // userLocation = {lat:coords.latitude,lng:coords.longitude};
    userLocation = {lat:-26.1908692,lng:28.0271597};

    map = new Map(document.getElementById("map"), {
        zoom: 18,
        center: userLocation,
        mapId: "DEMO_MAP_ID",
        style: 'mapbox://styles/mapbox/streets-v12',
    });


    // Updates the addresses when searching
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    const searchBox = new SearchBox(inputField);

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

async function addMarkers(){
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const content = document.createElement('div');
    content.classList.add('custom-marker');
    // content.classList.add('material-icons');
    // content.innerHTML="person_pin";
    // content.style="font-size:36px";

    let userMarker = new AdvancedMarkerElement({
        map: map,
        position: userLocation,
        title: "User",
        content: content,
    });

    markers.push(userMarker); // Add the user marker to the markers array

    try{
        
        const res = await axios.get(baseURL+"v1/map/getBuildings");

        let successData = res.data.data;

        if (successData.success==false || successData==undefined){
            console.log("Unable to get markers");
        }

        const data = res.data.data.data;

        data.forEach((element)=>{
            let newMarker = {
                id:element._id,
                building_name:element.building_name,
                campus:element.campus[0],
                type:element.type[0],
                code:element.code,
                location:{ lat: element.latitude, lng: element.longitude},
                building_id:element.building_id
            };

            APIMarkersInfo.push(newMarker);

            let newContent = document.createElement('div');
            newContent.classList.add(newMarker.type+'-marker');

            
            let newAdvancedMarker = new AdvancedMarkerElement({
                map: map,
                position: newMarker.location,
                title: newMarker.building_name,
                content:newContent
            });


            APIMarkers.push(newAdvancedMarker);

            let newCodeInsert = newMarker.code==null?"None":newMarker.code;

            let infoWindow = new google.maps.InfoWindow({
                content: `<h3>${newMarker.building_name}</h3><p>Code:${newCodeInsert}</p>`, // HTML content
              });

            newAdvancedMarker.addListener("click",()=>{
                infoWindow.open({
                    anchor: newAdvancedMarker,   // Attach to the marker
                    map,              // Open on the map
                    shouldFocus: false, // Optional: prevent the window from stealing focus
                  });
            })
        })
    }catch(error){
        //TODO make error shorter
        console.log(error);
    }


    //wheelchairs
    try{
        const res = await axios.get(baseURL+"v1/accessibility/getWheelchairs");

        let successData = res.data.data;

        if (successData.success==false || successData==undefined){
            console.log("Unable to get markers");
        }

        const data = res.data.data.data;

        data.forEach((element)=>{
            let newMarker = {
                id:element._id,
                name:element.name,
                wheelchair_friendly:element.wheelchair_friendly,
                ramp_available:element.ramp_available,
                elevator_nearby:element.elevator_nearby,
                type:"wheelchair",
                location:{ lat: element.latitude, lng: element.longitude},
            };

            APIMarkersInfo.push(newMarker);
            
            let newContent = document.createElement('div');
            newContent.classList.add("wheelchair-marker");

            let newAdvancedMarker = new AdvancedMarkerElement({
                map: map,
                position: newMarker.location,
                title: newMarker.building_name,
                content:newContent
            });

            APIMarkers.push(newAdvancedMarker);

            let infoWindow = new google.maps.InfoWindow({
                content: `<h3>${newMarker.name}</h3><p>Wheelchair Friendly:${newMarker.wheelchair_friendly}</p>`, // HTML content
              });

            newAdvancedMarker.addListener("click",()=>{
                infoWindow.open({
                    anchor: newAdvancedMarker,   // Attach to the marker
                    map,              // Open on the map
                    shouldFocus: false, // Optional: prevent the window from stealing focus
                  });
            })
        })
    }catch(error){
        //TODO make error shorter
        console.log(error);
    }
}


async function renderPage(){
    await initMap();
    await addMarkers();
}

navMeBtn.addEventListener("click", async function() { 
    if (navMeBtn.textContent=="Stop Navigation"){
        if (lastResponse==null){
            return;
        }

        navMeBtn.textContent = "Navigate Me";
        directionsTextArea.innerHTML="";
        if (polylinePath) {
            polylinePath.setMap(null);
        }

        // const email = localStorage.getItem("email");

        // let duration =lastResponse.data.duration

        // let dataToSend = {
        //     "user_id": "test",
        //     "start_location": {
        //       "latitude": origin["latitude"],
        //       "longitude": origin["longtitude"]
        //     },
        //     "end_location": {
        //       "latitude": dest["latitude"],
        //       "longitude": dest["longtitude"]
        //     },
        //     "duration":  duration.substring(0, duration.length - 1),
        //     "route_data": lastResponse.data.polyline
        // }   


        // console.log(JSON.stringify(dataToSend));

        // const response = await axios.post(baseURL+"v1/userRoutes/insertRoute",dataToSend);

        // console.log(response);
        lastResponse = null;
        return;
    }


    if (dest.latitude==-1 || dest.longitude==-1){
        alert("Please search some place first");
        return;
    }

    navMeBtn.textContent = "Stop Navigation";

    try {
        let coords = await getLocation();
        const url = baseURL+"v1/route_optimize/route_optimize";

        //TODO change back
        origin["latitude"]=coords.latitude;
        origin["longitude"]=coords.longitude;


        // origin["latitude"]=-26.1908692
        // origin["longitude"]=28.0271597


        let data = {
            "origin":origin,
            "destination":dest,
            "travelMode":"WALK"
        }

        const response = await axios.post(url, data);

        let outputData = response.data;

        lastResponse = outputData;


        const encodedPolyline = outputData.data["polyline"];
        const legs = outputData.data["legs"];

        var decodedPoints = polyline.decode(encodedPolyline);

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

        //add directions

        while (directionsTextArea.firstChild) {
            directionsTextArea.removeChild(directionsTextArea.firstChild);
        }

        
        legs[0]["steps"].forEach((leg)=>{
            const instructions = leg["navigationInstruction"];
            const distances = leg["localizedValues"];

            const instrText = instructions["instructions"];
            const instrMove = instructions["maneuver"];

            const distanceKM = distances["distance"]["text"];
            const time = distances["staticDuration"]["text"];

            // console.log(instrText,instrMove,distanceKM,time);


            const row = document.createElement("section");
            row.classList.add("directions-row")


            const instructionRow = document.createElement("section");
            instructionRow.classList.add("directions-row-instruction");
            instructionRow.innerHTML = "<p>"+instrText+"</p>"
            row.appendChild(instructionRow);

            const instructionDist = document.createElement("section");
            instructionDist.classList.add("directions-row-distance");
            instructionDist.innerHTML = "<p>"+distanceKM+"</p>"
            row.appendChild(instructionDist);
            
            const instructionTime = document.createElement("section");
            instructionTime.classList.add("directions-row-time");
            instructionTime.innerHTML = "<p>"+time+"</p>"
            row.appendChild(instructionTime);

            directionsTextArea.appendChild(row);
        })


    } catch (error) {
        console.error("Error getting location:", error);
    }
});


filter.addEventListener("change",(event)=>{
    let filterBy = filter.value;

    if (filterBy=="all"){
        APIMarkers.forEach((element)=>{
            element.map = map;
        })
    }else{
        for (let i=0;i<APIMarkers.length;i++){
            let info = APIMarkersInfo[i];
            let marker = APIMarkers[i];
    
            if (info.type==filterBy){
                marker.map=map;
            }else{
                marker.map=null;
            }
        }
    }
})

renderPage();






