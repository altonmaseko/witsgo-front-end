let map, userPosition, selectedStationId, selectedVehicleId;
let rentalActive = false;
let rentalTimer;
let rentalTimeLeft = 1200; // 20 minutes in seconds
const serverUrl = 'http://localhost:3000'; // Your server URL
// const serverUrl = 'https://witsgobackend.azurewebsites.net'

// Initialize the map
window.initMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -26.192082, lng: 28.026229 },
        zoom: 16
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(userPosition);
            userPosition = {
                
                lat : -26.1907,
                lng : 28.0302
            };
            map.setCenter(userPosition);

            new google.maps.Marker({
                position: userPosition,
                map: map,
                title: "You are here"
            });

            loadStations();
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Load stations and place markers on the map
async function loadStations() {
    try {
        const response = await axios.get(`${serverUrl}/v1/rental/stations`);
        const stations = response.data;

        stations.forEach(station => {
            const stationLatLng = { lat: station.location.lat, lng: station.location.lng };

            const marker = new google.maps.Marker({
                position: stationLatLng,
                map: map,
                icon: {
                    url: station.icon,
                    scaledSize: new google.maps.Size(40, 40)
                },
                title: station.name
            });

            marker.addListener('click', () => handleStationClick(station));
        });
    } catch (error) {
        console.error("Error loading stations:", error);
    }
}

// Handle station click
async function handleStationClick(station) {
    selectedStationId = station._id;

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.location.lat, station.location.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to rent or return a vehicle.");
    } else {
        await showVehicleDropdown(station);
    }
}

// Show vehicles for rent
async function showVehicleDropdown(station) {
    try {
        const vehicleIds = station.vehicles; // Assuming station.vehicles is an array of vehicle IDs
        console.log(vehicleIds);
        const vehiclePromises = vehicleIds.map(id => axios.get(`${serverUrl}/v1/rental/vehicle/${id}`));
        const vehicleResponses = await Promise.all(vehiclePromises);
        const vehicles = vehicleResponses.map(response => response.data);

        const vehicleSelect = document.getElementById('vehicleSelect');
        vehicleSelect.style.display = "block";
        vehicleSelect.innerHTML = "<option value=''>Please select a vehicle</option>";

        if (vehicles.length === 0) {
            alert("No vehicles available at this station.");
            return;
        }

        vehicles.forEach(vehicle => {
            vehicleSelect.innerHTML += `<option value="${vehicle._id}">${vehicle.type} - Available: ${vehicle.isAvailable ? 'yes' : 'no'}</option>`;
        });

        document.getElementById('stationSelect').style.display = "block";
    } catch (error) {
        console.error("Error loading vehicles:", error);
        alert("Failed to load vehicles. Please try again.");
    }
}

// Rent the selected vehicle
async function rentVehicle() {
    const vehicleSelect = document.getElementById('vehicleSelect');
    selectedVehicleId = vehicleSelect.value;

    if (!selectedVehicleId) {
        alert("Please select a vehicle to rent.");
        return;
    }

    const station = await axios.get(`${serverUrl}/rental/stations/${selectedStationId}`);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.data.location.lat, station.data.location.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to rent the vehicle.");
        return;
    }

    try {
        const response = await axios.post(`${serverUrl}/rental/rent`, {
            vehicleId: selectedVehicleId,
            stationId: selectedStationId,
            userId: 'userId' // Replace with actual user ID
        });

        if (response.data) {
            alert("Vehicle rented successfully!");
            startRentalTimer();
        }
    } catch (error) {
        console.error("Error renting vehicle:", error);
    }
}

// Start the rental timer
function startRentalTimer() {
    rentalActive = true;
    updateTimerDisplay();
    rentalTimer = setInterval(() => {
        rentalTimeLeft--;
        updateTimerDisplay();

        if (rentalTimeLeft === 300) {
            alert("5 minutes remaining on your rental.");
        }

        if (rentalTimeLeft <= 0) {
            endRentalTimer();
        }
    }, 1000);
}

// Update the rental timer display
function updateTimerDisplay() {
    const minutes = Math.floor(rentalTimeLeft / 60);
    const seconds = rentalTimeLeft % 60;
    document.getElementById('timer').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// End the rental timer
function endRentalTimer() {
    clearInterval(rentalTimer);
    rentalActive = false;
    alert("Rental time has ended. Please return the vehicle.");
}

// Return the rented vehicle
async function returnVehicle() {
    const station = await axios.get(`${serverUrl}/rental/stations/${selectedStationId}`);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.data.location.lat, station.data.location.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to return the vehicle.");
    } else {
        try {
            const response = await axios.post(`${serverUrl}/rental/return`, {
                vehicleId: selectedVehicleId,
                stationId: selectedStationId
            });

            if (response.data.success) {
                endRentalTimer();
                alert("Vehicle returned successfully!");
            } else {
                alert("Error: " + response.data.error);
            }
        } catch (error) {
            console.error("Error returning vehicle:", error);
        }
    }
}

// Cancel the vehicle selection
function cancelSelection() {
    document.getElementById('vehicleSelect').style.display = "none";
    document.getElementById('stationSelect').style.display = "none";
}

// Call initMap to initialize the map
window.onload = initMap;
