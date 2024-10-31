let notifier = new AWN()

import { clientUrl, serverUrl } from "./constants.js";
let map, userPosition, selectedStationId, selectedVehicleId, selectedVehicleType;
let rentalActive = false;
let rentalTimer;
let rentalTimeLeft = 1200; // 20 minutes in seconds


let userMarker = null;

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
            //test location
            // userPosition = {
            //     lat: -26.190476,
            //     lng: 28.026834
            // };
            map.setCenter(userPosition);

            // Add user position marker
            userMarker = new google.maps.Marker({
                position: userPosition,
                map: map,
                icon: {
                    url: '/images/person2.png',
                    scaledSize: new google.maps.Size(40, 40)
                },
                title: 'Your Position'
            });

            // ADDED: Start watching position
            navigator.geolocation.watchPosition(
                (position) => {
                    console.log('Position updated:', position);
                    // Update user position
                    userPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    // Update marker position
                    if (userMarker) {
                        userMarker.setPosition(userPosition);
                    }
                },
                (error) => {
                    console.log('Error watching position:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );

            loadStations();
        });
    } else {
        // alert("Geolocation is not supported by this browser.");

        notifier.alert("Geolocation is not supported by this browser.",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Error Occured:' }
            });
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
        // alert("You are not within 20 meters of the station. Move closer to rent or return a vehicle.");

        notifier.alert("You are not within 20 meters of the station. Move closer to rent or return a vehicle.",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Get Closer' }
            });

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
async function showVehicleDropdown(station) {
    try {
        const vehicleIds = station.vehicles;
        const vehiclePromises = vehicleIds.map(id => axios.get(`${serverUrl}/v1/rental/vehicle/${id}`));
        const vehicleResponses = await Promise.all(vehiclePromises);
        const vehicles = vehicleResponses.map(response => response.data);

        const vehicleSelect = document.getElementById('vehicleSelect');

        // Check if there are vehicles available
        if (vehicles.length === 0) {
            // alert("No vehicles available at this station.");

            notifier.info("No vehicles available at this station.",
                {
                    durations: { info: 4000 },
                    labels: { info: 'Please Note:' }
                });

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
    if (rentalActive) {
        // alert("Already rented a vehicle");

        notifier.info("Already rented a vehicle",
            {
                durations: { info: 4000 },
                labels: { info: 'Please Note:' }
            });

        return;
    }

    const vehicleSelect = document.getElementById('vehicleSelect');
    selectedVehicleId = vehicleSelect.value;
    selectedVehicleType = vehicleSelect.options[vehicleSelect.selectedIndex].text.split(' - ')[0];

    if (!selectedVehicleId) {
        // alert("Please select a vehicle to rent.");

        notifier.info("Please select a vehicle to rent.",
            {
                durations: { info: 4000 },
                labels: { info: 'Please Note:' }
            });

        return;
    }

    // Fetch the selected vehicle's data to check availability
    try {
        const vehicleResponse = await axios.get(`${serverUrl}/v1/rental/vehicle/${selectedVehicleId}`);
        const selectedVehicle = vehicleResponse.data;

        // Check if the selected vehicle is available
        if (!selectedVehicle.isAvailable) {
            // alert("The selected vehicle is currently unavailable. Please choose another vehicle.");

            notifier.info("The selected vehicle is currently unavailable. Please choose another vehicle.",
                {
                    durations: { info: 4000 },
                    labels: { info: 'Please Note:' }
                });

            return; // Stop the rental process if the vehicle is not available
        }
    } catch (error) {
        console.error("Error fetching vehicle data:", error);
        // alert("An error occurred while checking vehicle availability.");

        notifier.alert("An error occurred while checking vehicle availability.",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Error Occured:' }
            });
        return;
    }

    const station = await axios.get(`${serverUrl}/v1/rental/station/${selectedStationId}`);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userPosition.lat, userPosition.lng),
        new google.maps.LatLng(station.data.location.lat, station.data.location.lng)
    );

    if (distance > 20) {
        // alert("You are not within 20 meters of the station. Move closer to rent the vehicle.");

        notifier.info("You are not within 20 meters of the station. Move closer to rent the vehicle.",
            {
                durations: { info: 4000 },
                labels: { info: 'Please Note:' }
            });

        return;
    }

    try {
        const response = await axios.post(`${serverUrl}/v1/rental/rent`, {
            vehicleId: selectedVehicleId,
            stationId: selectedStationId,
            userId: localStorage.getItem("userId")
        });

        if (response.data) {
            // alert("Vehicle rented successfully!");

            notifier.success("Vehicle rented successfully!",
                {
                    durations: { success: 4000 },
                    labels: { success: 'Please Note:' }
                });

            startRentalTimer();
            updateTimerDisplay();
            document.querySelector('.button-group').style.display = "none";
            document.getElementById('return-button').style.display = "block";
            document.getElementById('vehicleSelect').style.display = "none";

            // Store rental information
            localStorage.setItem('selectedVehicleType', vehicleSelect.options[vehicleSelect.selectedIndex].text);
            localStorage.setItem('selectedVehicleId', selectedVehicleId);
            localStorage.setItem('rentalStartTime', new Date().getTime());
            localStorage.setItem('rentalTimeLeft', rentalTimeLeft);

            // Display the rented vehicle message
            const rentedVehicleMessage = document.getElementById('rented-vehicle-message');
            rentedVehicleMessage.innerText = `You are currently renting a ${selectedVehicleType}. Click on a station within 20 meters to return it.`;
            rentedVehicleMessage.style.display = "block"; // Show the message
            rentedVehicleMessage.style.textAlign = "center"; // Center the message
        }
    } catch (error) {
        console.error("Error renting vehicle:", error);
    }

    rentalActive = true;
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
            // alert("5 minutes left! Please find a rental station to return the vehicle to.");

            notifier.info("5 minutes left! Please find a rental station to return the vehicle to.",
                {
                    durations: { info: 4000 },
                    labels: { info: 'Please Note:' }
                });

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
    // alert("Your rental has ended. Please return the vehicle.");

    notifier.alert("Your rental has ended. Please return the vehicle.",
        {
            durations: { alert: 4000 },
            labels: { alert: 'Please Note:' }
        });

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
    try {
        const station = await axios.get(`${serverUrl}/v1/rental/station/${selectedStationId}`);
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userPosition.lat, userPosition.lng),
            new google.maps.LatLng(station.data.location.lat, station.data.location.lng)
        );

        if (distance > 20) {
            // alert("You are not within 20 meters of the station. Move closer to return the vehicle.");

            notifier.info("You are not within 20 meters of the location. Move closer to return the vehicle.",
                {
                    durations: { info: 4000 },
                    labels: { info: 'Please Note:' }
                });

            return;
        }

        // Send POST request to return the vehicle
        const response = await axios.post(`${serverUrl}/v1/rental/return`, {
            vehicleId: selectedVehicleId,
            stationId: selectedStationId,
            userId: localStorage.getItem("userId")
        });

        if (response.data) {
            // alert("Vehicle returned successfully! Thank you for using our service.");

            notifier.success("Vehicle returned successfully! Thank you for using our service.",
                {
                    durations: { success: 4000 },
                    labels: { success: 'Please Note:' }
                });

            // Reset rental state and clear UI
            resetRental();  // This will clear the timer, hide the rental message, and clear local storage

            // Hide the rented vehicle message and the timer
            document.getElementById('rented-vehicle-message').style.display = "none"; // Hide vehicle type message
            document.getElementById('rental-status-container').style.display = "none"; // Hide the timer container

            // Refresh the page
            location.reload(); // This will reload the entire page
        }
    } catch (error) {
        console.error("Error returning vehicle:", error.response ? error.response.data : error.message);
        // alert("An error occurred while returning the vehicle. Please try again.");

        notifier.alert("An error occurred while returning the vehicle. Please try again.",
            {
                durations: { alert: 4000 },
                labels: { alert: 'Please Note:' }
            });

    }

    // Check if button group and return button exist before hiding them
    const buttonGroup = document.querySelector('.button-group');
    const returnButton = document.getElementById('return-button');

    if (buttonGroup && returnButton) {
        returnButton.style.display = "none"; // Hide the return button
        buttonGroup.style.display = "none";  // Also hide the button group
    } else {
        console.error("Button group or return button not found in DOM");
    }

    rentalActive = false; // Reset rental state
}

// Reset rental state after returning the vehicle
function resetRental() {
    clearInterval(rentalTimer);  // Clear the rental timer
    rentalActive = false;
    rentalTimeLeft = 1200; // Reset the timer to 20 minutes

    // Clear local storage
    localStorage.removeItem('selectedVehicleId');
    localStorage.removeItem('rentalStartTime');
    localStorage.removeItem('rentalTimeLeft');

    // Reset UI elements
    document.getElementById('timer').innerText = "20:00"; // Reset timer display to initial value
    // document.getElementById('stationSelect').style.display = "none";
    document.getElementById('vehicleSelect').style.display = "none";
    document.querySelector('.button-group').style.display = "none";
    document.getElementById('rent-button').style.display = "none";
    document.getElementById('return-button').style.display = "none";
    document.getElementById('rental-status-container').style.display = "none"; // Hide rental status
    document.getElementById('availability').innerText = "Click on a station to rent a vehicle!";

    // Hide the rented vehicle message
    document.getElementById('rented-vehicle-message').style.display = "none";

    // Hide the timer display
    document.getElementById('timer').style.display = "none"; // Hide the timer after returning
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


document.getElementById("vehicleSelect").addEventListener("click", updateControls);
document.getElementById("rent-button").addEventListener("click", rentVehicle);
document.getElementById("return-button").addEventListener("click", returnVehicle);
document.getElementById("cancel-button").addEventListener("click", cancelSelection);

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
            // console.log("Rental time left:", rentalTimeLeft);
            startRentalTimer(); // Start the timer with the remaining time
            displayRentedVehicleState(); // Show rented vehicle details instead of dropdown
            const availabilityMessage = document.getElementById('availability');
            availabilityMessage.innerText = `You rented vehicle ID: ${selectedVehicleIdStored}`;
            availabilityMessage.style.textAlign = "center";
        }
    } else {
        // If no rental information is stored, initialize the map normally
        window.initMap();
    }
};


