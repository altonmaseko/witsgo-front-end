import { clientUrl, serverUrl } from "./constants.js";
let map, userPosition, selectedStationId, selectedVehicleId;
let rentalActive = false;
let rentalTimer;
let rentalTimeLeft = 1200; // 20 minutes in seconds

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
            userPosition = {
                lat: -26.1922,
                lng: 28.0285
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
        if (rentalActive) {
            // Show return button if the user has rented a vehicle and is within 20 meters
            document.querySelector('.button-group').style.display = "flex";
            document.getElementById('return-button').style.display = "block";
            document.getElementById('rent-button').style.display = "none"; // Hide the rent button
        } else {
            // If no vehicle is rented, allow renting a new one
            await showVehicleDropdown(station);
        }
    }
}


function displayRentedVehicleState() {
    const vehicleSelect = document.getElementById('vehicleSelect');
    const availabilityMessage = document.getElementById('availability');

    vehicleSelect.style.display = "none";
    document.querySelector('.button-group').style.display = "none";
    availabilityMessage.innerText = `You rented a vehicle! Click on a station within 20 meters to return it.`;
    document.getElementById('rental-status-container').style.display = "block";
}


// Show vehicle dropdown
// Show vehicle dropdown
async function showVehicleDropdown(station) {
    try {
        const vehicleIds = station.vehicles;
        const vehiclePromises = vehicleIds.map(id => axios.get(`${serverUrl}/v1/rental/vehicle/${id}`));
        const vehicleResponses = await Promise.all(vehiclePromises);
        const vehicles = vehicleResponses.map(response => response.data);

        const vehicleSelect = document.getElementById('vehicleSelect');
        
        // Check if there are vehicles available
        if (vehicles.length === 0) {
            alert("No vehicles available at this station.");
            vehicleSelect.style.display = "none"; // Hide the dropdown
            document.querySelector('.button-group').style.display = "none"; // Hide button group
            return; // Exit the function if no vehicles are available
        }

        // Display the vehicle dropdown
        vehicleSelect.style.display = "block";
        vehicleSelect.innerHTML = "<option value=''>Please select a vehicle</option>";

        vehicles.forEach(vehicle => {
            vehicleSelect.innerHTML += `<option value="${vehicle._id}">${vehicle.type} - Available: ${vehicle.isAvailable ? 'yes' : 'no'}</option>`;
        });

        document.querySelector('.button-group').style.display = "flex"; // Show button group
    } catch (error) {
        console.error("Error loading vehicles:", error);
    }
}


// Rent the selected vehicle
async function rentVehicle() {
    if (rentalActive == true) {
        alert("Already rented a vehicle");
        return;
    }

    const vehicleSelect = document.getElementById('vehicleSelect');
    selectedVehicleId = vehicleSelect.value;

    if (!selectedVehicleId) {
        alert("Please select a vehicle to rent.");
        return;
    }

    const station = await axios.get(`${serverUrl}/v1/rental/station/${selectedStationId}`);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.data.location.lat, station.data.location.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to rent the vehicle.");
        return;
    }

    try {
        const response = await axios.post(`${serverUrl}/v1/rental/rent`, {
            vehicleId: selectedVehicleId,
            stationId: selectedStationId,
            userId: localStorage.getItem("userId")
        });

        if (response.data) {
            alert("Vehicle rented successfully!");
            startRentalTimer();
            document.querySelector('.button-group').style.display = "none";
            document.getElementById('return-button').style.display = "block";
            // Hide vehicle dropdown
            document.getElementById('vehicleSelect').style.display = "none";
        }
    } catch (error) {
        console.error("Error renting vehicle:", error);
    }

    rentalActive = true;

    if (response.data) {
        alert("Vehicle rented successfully!");
        startRentalTimer();
        document.querySelector('.button-group').style.display = "none";
        document.getElementById('return-button').style.display = "block";
        document.getElementById('vehicleSelect').style.display = "none";

        // Store rental information
        localStorage.setItem('selectedVehicleId', selectedVehicleId);
        localStorage.setItem('rentalStartTime', new Date().getTime());
        localStorage.setItem('rentalTimeLeft', rentalTimeLeft);

        // Display the rented vehicle message
        const rentedVehicleMessage = document.getElementById('rented-vehicle-message');
        rentedVehicleMessage.innerText = `You are currently renting vehicle ID: ${selectedVehicleId}`;
        rentedVehicleMessage.style.display = "block"; // Show the message
    }
}



// Start rental timer
function startRentalTimer() {
    rentalActive = true;
    updateTimerDisplay();
    document.getElementById('rental-status-container').style.display = 'block'; // Show the timer
    
    rentalTimer = setInterval(() => {
        rentalTimeLeft--;
        localStorage.setItem('rentalTimeLeft', rentalTimeLeft); // Store the updated rental time left
        updateTimerDisplay();

        // Check for 5 minutes remaining (300 seconds)
        if (rentalTimeLeft === 300) {
            alert("5 minutes left! Please find a rental station to return the vehicle to.");
        }

        // End rental if time runs out
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
// Return the vehicle
async function returnVehicle() {
    const station = await axios.get(`${serverUrl}/v1/rental/station/${selectedStationId}`);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.data.location.lat, station.data.location.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to return the vehicle.");
        return;
    }

    try {
        const response = await axios.post(`${serverUrl}/v1/rental/return`, {
            vehicleId: selectedVehicleId,
            stationId: selectedStationId,
            userId: localStorage.getItem("userId")
        });

        if (response.data) {
            alert("Vehicle returned successfully! Thank you for using our service.");
            resetRental();
        }
    } catch (error) {
        console.error("Error returning vehicle:", error);
    }
    
    rentalActive = false;
    document.getElementById('return-button').style.display = "none"; // Hide the return button
}


// Reset rental state after returning the vehicle
// Reset rental state after returning the vehicle
function resetRental() {
    clearInterval(rentalTimer);
    rentalActive = false;
    rentalTimeLeft = 1200; // Reset the timer to 20 minutes

    // Clear local storage
    localStorage.removeItem('selectedVehicleId');
    localStorage.removeItem('rentalStartTime');
    localStorage.removeItem('rentalTimeLeft');

    document.getElementById('timer').innerText = "20:00";
    document.getElementById('stationSelect').style.display = "none";
    document.getElementById('vehicleSelect').style.display = "none";
    document.querySelector('.button-group').style.display = "none";
    document.getElementById('rent-button').style.display = "none";
    document.getElementById('return-button').style.display = "none";
    document.getElementById('rental-status-container').style.display = "none";
    document.getElementById('availability').innerText = "Click on a station to rent a vehicle!";
    
    // Hide the rented vehicle message
    document.getElementById('rented-vehicle-message').style.display = "none";
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


document.getElementById("vehicleSelect").addEventListener("click",updateControls);
document.getElementById("rent-button").addEventListener("click",rentVehicle);
document.getElementById("return-button").addEventListener("click",returnVehicle);
document.getElementById("cancel-button").addEventListener("click",cancelSelection);

window.onload = function () {
    const rentalStartTime = localStorage.getItem('rentalStartTime');
    const rentalTimeLeftStored = localStorage.getItem('rentalTimeLeft');
    const selectedVehicleIdStored = localStorage.getItem('selectedVehicleId');

    if (rentalStartTime) {
        rentalActive = true;

        // Calculate the elapsed time since the vehicle was rented
        const elapsedTime = Math.floor((new Date().getTime() - rentalStartTime) / 1000);
        
        // Calculate the remaining time left
        rentalTimeLeft = rentalTimeLeftStored ? parseInt(rentalTimeLeftStored) - elapsedTime : 1200 - elapsedTime; // 1200 seconds = 20 minutes

        // Ensure that the rental time left does not go below zero
        if (rentalTimeLeft <= 0) {
            resetRental(); // Reset the rental if time is up
        } else {
            // Update the display with the remaining time
            updateTimerDisplay();
            startRentalTimer(); // Start the timer with the remaining time
            displayRentedVehicleState(); // Show rented vehicle details instead of dropdown
            document.getElementById('availability').innerText = `You rented vehicle ID: ${selectedVehicleIdStored}`;
        }
    } else {
        // If no rental information is stored, initialize the map normally
        initMap();
    }
};


