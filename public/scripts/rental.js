let map, userPosition, selectedStationId;
let rentalActive = false;
let rentalTimer;
let rentalTimeLeft = 1200; // 20 minutes in seconds
let popupTimeout, reminderTimeout;

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -26.192082, lng: 28.026229 }, // Default center of campus
        zoom: 16
    });

    // Get user's current position
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(userPosition);

            //testing
            // userPosition = {
            //     lat: -26.192082,
            //     lng: 28.026229 
            // };
            // map.setCenter(userPosition);

            // Place the user's position on the map
            new google.maps.Marker({
                position: userPosition,
                map: map,
                title: "You are here"
            });

            // Fetch and place station markers
            loadStations();
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Load stations from the backend and place markers on the map
async function loadStations() {
    try {
        const response = await axios.get('/rental/stations');
        const stations = response.data;

        stations.forEach(station => {
            const stationLatLng = { lat: station.lat, lng: station.lng };

            const marker = new google.maps.Marker({
                position: stationLatLng,
                map: map,
                icon: station.icon, // Icon for the station
                title: station.name
            });

            // Add click listener for the station marker
            marker.addListener('click', () => handleStationClick(station));
        });
    } catch (error) {
        console.error("Error loading stations:", error);
    }
}

// Handle clicking on a station marker
async function handleStationClick(station) {
    selectedStationId = station.id;

    // Check if the user is within 20 meters of the station
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.lat, station.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to rent or return a vehicle.");
    } else {
        // User is within range, show vehicle selection
        await showVehicleDropdown(station);
    }
}

// Show the vehicle dropdown for a station
async function showVehicleDropdown(station) {
    try {
        const response = await axios.get(`/rental/stations/${station.id}/vehicles`);
        const vehicles = response.data;

        const vehicleSelect = document.getElementById('vehicleSelect');
        vehicleSelect.style.display = "block";
        vehicleSelect.innerHTML = `<option value="">Please select a vehicle</option>`;

        vehicles.forEach(vehicle => {
            vehicleSelect.innerHTML += `<option value="${vehicle._id}">${vehicle.type} - Available: ${vehicle.available}</option>`;
        });

        document.getElementById('stationSelect').style.display = "block";
    } catch (error) {
        console.error("Error loading vehicles:", error);
    }
}

// Rent the selected vehicle
async function rentVehicle() {
    const vehicleId = document.getElementById('vehicleSelect').value;
    if (!vehicleId) {
        alert("Please select a vehicle.");
        return;
    }

    try {
        const response = await axios.post('/rental/rent', {
            vehicleId: vehicleId,
            fromStationId: selectedStationId
        });

        if (response.data.success) {
            startRentalTimer();
            alert("Vehicle rented successfully!");
        } else {
            alert("Error: " + response.data.error);
        }
    } catch (error) {
        console.error("Error renting vehicle:", error);
    }
}

// Start the 20-minute rental countdown
function startRentalTimer() {
    rentalActive = true;
    updateTimerDisplay();
    rentalTimer = setInterval(() => {
        rentalTimeLeft--;
        updateTimerDisplay();

        if (rentalTimeLeft === 300) {
            // 5-minute reminder
            alert("5 minutes remaining on your rental.");
        }

        if (rentalTimeLeft <= 0) {
            endRentalTimer();
        }
    }, 1000);
}

// Update the displayed rental timer
function updateTimerDisplay() {
    const minutes = Math.floor(rentalTimeLeft / 60);
    const seconds = rentalTimeLeft % 60;
    document.getElementById('timer').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// End the rental countdown
function endRentalTimer() {
    clearInterval(rentalTimer);
    rentalActive = false;
    alert("Rental time has ended. Please return the vehicle.");
}

// Return the rented vehicle
async function returnVehicle() {
    // Check if the user is within 20 meters of the station to return the vehicle
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.lat, station.lng)
    );

    if (distance > 20) {
        alert("You are not within 20 meters of the station. Move closer to return the vehicle.");
    } else {
        try {
            const response = await axios.post('/rental/return', {
                vehicleId: selectedVehicleId, // Assuming a global variable `selectedVehicleId`
                toStationId: selectedStationId
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
