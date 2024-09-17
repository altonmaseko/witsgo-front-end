let map;
let stationMarkers = [];
const DISTANCE_THRESHOLD = 150; // meters
const RENT_THRESHOLD = 50; // meters
let selectedStation = null;
let rentedVehicle = null;

window.onload = initMap;
const defaultLocation = {
  lat: -26.1929,
  lng: 28.0283
};
// Initialize the Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -26.1929, lng: 28.0283 }, // Wits University coordinates
        zoom: 16
    });

    // Get user's location and show nearby stations
    navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        showNearbyStations(defaultLocation);
    }, (error) => {
        console.error('Error getting user location:', error);
    });
}

// Show nearby stations based on user's current location
function showNearbyStations(userLocation) {
    // Clear previous markers
    stationMarkers.forEach((marker) => marker.setMap(null));
    stationMarkers = [];

    // Fetch stations data from the backend
    axios.get('/api/stations')
        .then((response) => {
            const stations = response.data;

            stations.forEach((station) => {
                const stationLocation = new google.maps.LatLng(station.lat, station.lng);
                const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
                const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLocation);

                if (distance <= DISTANCE_THRESHOLD) {
                    const stationMarker = new google.maps.Marker({
                        position: { lat: station.lat, lng: station.lng },
                        map: map,
                        title: `${station.name} - Scooters: ${station.scooter_count}, Bicycles: ${station.bicycle_count}, Skateboards: ${station.skateboard_count}`,
                        icon: {
                            url: station.icon,
                            scaledSize: new google.maps.Size(40, 40) // Resize icon
                        }
                    });

                    // Add click listener for the marker
                    google.maps.event.addListener(stationMarker, 'click', function () {
                        selectStation(station.id, userLocation);
                    });

                    stationMarkers.push(stationMarker);
                }
            });
        })
        .catch((error) => {
            console.error('Error fetching stations:', error);
        });
}

// Select a station when the marker is clicked
function selectStation(stationId, userLocation) {
    // Fetch station's vehicle data
    axios.get(`/api/stations/${stationId}/vehicles`)
        .then((response) => {
            const station = response.data;
            const stationLocation = new google.maps.LatLng(station.lat, station.lng);
            const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLocation);

            // Check if the user is close enough to rent/return
            if (distance <= RENT_THRESHOLD) {
                displayStationDropdown(station);
            } else {
                alert('You must be within 50 meters of the station to rent or return a vehicle.');
            }
        })
        .catch((error) => {
            console.error('Error fetching station vehicles:', error);
        });
}

// Display the station dropdown with vehicles and actions
function displayStationDropdown(station) {
    const dropdown = document.getElementById('stationDropdown');
    dropdown.innerHTML = ''; // Clear previous options

    const select = document.createElement('select');
    const defaultOption = document.createElement('option');
    defaultOption.text = 'Please select a vehicle';
    defaultOption.value = '';
    select.appendChild(defaultOption);

    // Add available vehicles to the dropdown
    station.vehicles.forEach((vehicle) => {
        if (vehicle.status === 'available') {
            const option = document.createElement('option');
            option.text = `${vehicle.type} (${vehicle.count} available)`;
            option.value = vehicle.id;
            select.appendChild(option);
        }
    });

    // Create rent button
    const rentButton = document.createElement('button');
    rentButton.textContent = 'Rent Vehicle';
    rentButton.disabled = true;

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';

    // Enable rent button when a vehicle is selected
    select.addEventListener('change', (e) => {
        rentedVehicle = e.target.value;
        rentButton.disabled = !rentedVehicle;
    });

    // Rent vehicle action
    rentButton.addEventListener('click', () => {
        if (rentedVehicle) {
            rentVehicle(station.id, rentedVehicle);
        }
    });

    // Cancel action
    cancelButton.addEventListener('click', () => {
        rentedVehicle = null;
        dropdown.innerHTML = ''; // Clear dropdown
    });

    dropdown.appendChild(select);
    dropdown.appendChild(rentButton);
    dropdown.appendChild(cancelButton);
}

// Rent a vehicle
function rentVehicle(stationId, vehicleId) {
    axios.post(`/api/rent`, { stationId, vehicleId })
        .then((response) => {
            alert('Vehicle rented successfully!');
            rentedVehicle = null;

            // Disable the station and vehicle selection during the rental
            document.getElementById('stationDropdown').innerHTML = ''; // Clear dropdown
            showNearbyStations(userLocation); // Refresh available vehicles and stations
        })
        .catch((error) => {
            console.error('Error renting vehicle:', error);
        });
}
