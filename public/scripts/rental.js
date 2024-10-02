import { clientUrl, serverUrl } from "./constants.js";
let map, userPosition, selectedStationId, selectedVehicleId;
let rentalActive = false;
let rentalTimer;
let rentalTimeLeft = 1200; // 20 minutes in seconds
//const serverUrl = 'http://localhost:3000'; // Your server URL
// const serverUrl = 'https://witsgobackend.azurewebsites.net'

// Initialize the map
window.initMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -26.192082, lng: 28.026229 },
        zoom: 16
    });

    // Get user position
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(userPosition);
            userPosition = {

                lat: -26.1907,
                lng: 28.0302
            };
            map.setCenter(userPosition);
            loadStations();
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Load stations and place markers
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

// Show vehicle dropdown
async function showVehicleDropdown(station) {
    try {
        const vehicleIds = station.vehicles;
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

        document.querySelector('.button-group').style.display = "flex";
    } catch (error) {
        console.error("Error loading vehicles:", error);
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
            document.querySelector('.button-group').style.display = "none";
            document.getElementById('return-button').style.display = "block";
        }
    } catch (error) {
        console.error("Error renting vehicle:", error);
    }
}

// Start rental timer
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

// Update rental timer display
function updateTimerDisplay() {
    const minutes = Math.floor(rentalTimeLeft / 60);
    const seconds = rentalTimeLeft % 60;
    document.getElementById('timer').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// End rental timer
function endRentalTimer() {
    clearInterval(rentalTimer);
    rentalActive = false;
    rentalTimeLeft = 0;
    document.getElementById('timer').innerText = "00:00";
    alert("Your rental has ended. Please return the vehicle.");
}

// Cancel the vehicle selection
function cancelSelection() {
    document.getElementById('vehicleSelect').style.display = "none";
    document.querySelector('.button-group').style.display = "none";
    document.getElementById('rent-button').style.display = "none";
    document.getElementById('return-button').style.display = "none";
}

// Return the vehicle
async function returnVehicle() {
    const station = await axios.get(`${serverUrl}/rental/stations/${selectedStationId}`);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.data.location.lat, station.data.location.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to return the vehicle.");
        return;
    }

    try {
        const response = await axios.post(`${serverUrl}/rental/return`, {
            vehicleId: selectedVehicleId,
            stationId: selectedStationId,
            userId: 'userId' // Replace with actual user ID
        });

        if (response.data) {
            alert("Vehicle returned successfully! Thank you for using our service.");
            resetRental();
        }
    } catch (error) {
        console.error("Error returning vehicle:", error);
    }
}

// Reset rental state after returning the vehicle
function resetRental() {
    clearInterval(rentalTimer);
    rentalActive = false;
    rentalTimeLeft = 1200; // Reset the timer to 20 minutes

    document.getElementById('timer').innerText = "20:00";
    document.getElementById('stationSelect').style.display = "none";
    document.getElementById('vehicleSelect').style.display = "none";
    document.querySelector('.button-group').style.display = "none";
    document.getElementById('rent-button').style.display = "none";
    document.getElementById('return-button').style.display = "none";
    document.getElementById('rental-status-container').style.display = "none";
    document.getElementById('availability').innerText = "Click on a station to rent a vehicle!";
}

// Update the controls based on vehicle selection
function updateControls() {
    const vehicleSelect = document.getElementById('vehicleSelect');
    if (vehicleSelect.value) {
        document.getElementById('rent-button').style.display = "inline-block";
    } else {
        document.getElementById('rent-button').style.display = "none";
    }
}

window.onload = initMap;
