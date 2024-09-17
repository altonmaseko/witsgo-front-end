const DISTANCE_THRESHOLD = 150; // meters to show stations
const RENT_THRESHOLD = 50; // meters to rent or return a vehicle
let stations = []; // Initialize as empty array
let userMarker = null;
let map;
let stationMarkers = [];
let selectedStationId = null;
let testLocation = null; // Variable to store test location
let rentalEndTime = null; // Variable to store rental end time

function initMap() {
  const defaultCenter = { lat: -26.192082, lng: 28.026229 };

  map = new google.maps.Map(document.getElementById('map'), {
    center: defaultCenter,
    zoom: 15
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (testLocation) {
          updateUserLocation(testLocation);
          showNearbyStations(testLocation);
        } else {
          map.setCenter(userLocation);
          updateUserLocation(userLocation);
          showNearbyStations(userLocation);
        }
      },
      (error) => {
        console.error('Error getting location: ', error);
        alert('Unable to retrieve your location. Map will start at default center.');
        map.setCenter(defaultCenter);
        updateUserLocation(defaultCenter);
        showNearbyStations(defaultCenter);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    alert('Geolocation is not supported by your browser.');
    map.setCenter(defaultCenter);
    updateUserLocation(defaultCenter);
    showNearbyStations(defaultCenter);
  }
}

function updateUserLocation(userLocation) {
  if (userMarker) {
    userMarker.setPosition(userLocation);
  } else {
    userMarker = new google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 1
      }
    });
  }
}

async function fetchStations() {
  try {
    const response = await axios.get('/stations');
    stations = response.data; // Update the stations array with data from the server
    showNearbyStations(userMarker.getPosition()); // Show stations on the map
  } catch (error) {
    console.error('Error fetching stations:', error);
  }
}

async function fetchVehiclesAtStation(stationId) {
  try {
    const response = await axios.get(`/stations/${stationId}/vehicles`);
    const vehicles = response.data;
    updateVehicleDropdown(vehicles); // Update vehicle dropdown with fetched data
  } catch (error) {
    console.error('Error fetching vehicles:', error);
  }
}

function showNearbyStations(userLocation) {
  stationMarkers.forEach((marker) => marker.setMap(null)); // Clear previous markers

  stations.forEach((station) => {
    const stationLocation = new google.maps.LatLng(station.lat, station.lng);
    const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLocation);

    if (distance <= DISTANCE_THRESHOLD) {
      const stationMarker = new google.maps.Marker({
        position: { lat: station.lat, lng: station.lng },
        map: map,
        title: station.name,
        icon: {
          url: station.icon,
          scaledSize: new google.maps.Size(40, 40) // Resize icon
        }
      });

      google.maps.event.addListener(stationMarker, 'click', function () {
        selectStation(station.id);
      });

      stationMarkers.push(stationMarker);
    }
  });
}

function selectStation(stationId) {
  selectedStationId = stationId;
  fetchVehiclesAtStation(stationId); // Fetch vehicles when a station is selected
}

function updateVehicleDropdown(vehicles) {
  const vehicleSelect = document.getElementById('vehicleSelect');
  vehicleSelect.innerHTML = ''; // Clear previous options
  Object.keys(vehicles).forEach(vehicleId => {
    const option = document.createElement('option');
    option.value = vehicleId;
    option.textContent = `${vehicleId.charAt(0).toUpperCase() + vehicleId.slice(1)} (${vehicles[vehicleId]})`;
    vehicleSelect.appendChild(option);
  });

  vehicleSelect.style.display = 'block';
}

function showVehicleDropdown() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const stationSelect = document.getElementById('stationSelect');
  const selectedVehicle = stationSelect.value;

  if (selectedStationId && selectedVehicle) {
    fetchVehiclesAtStation(selectedStationId); // Fetch vehicles for selected station

    vehicleSelect.style.display = 'block';
    stationSelect.style.display = 'none';
    document.getElementById('cancelButton').style.display = 'inline-block';
    updateControls(); // Ensure the rent button is visible
  }
}

function cancelSelection() {
  const stationSelect = document.getElementById('stationSelect');
  const vehicleSelect = document.getElementById('vehicleSelect');
  const cancelButton = document.getElementById('cancelButton');
  const rentButton = document.getElementById('rentButton');

  stationSelect.style.display = 'none';
  vehicleSelect.style.display = 'none';
  cancelButton.style.display = 'none';
  rentButton.style.display = 'none'; // Hide rent button when canceled
  selectedStationId = null;
}

function updateControls() {
  var select = document.getElementById('vehicleSelect');
  var rentButton = document.getElementById('rentButton');
  var availability = document.getElementById('availability');

  if (select.value) {
    availability.textContent = `Selected vehicle: ${select.value}`;
    rentButton.style.display = 'inline-block';
  } else {
    availability.textContent = 'Select a vehicle to see availability';
    rentButton.style.display = 'none';
  }

  // Only show the cancel button if no vehicle is rented
  if (!rentalEndTime) {
    document.getElementById('cancelButton').style.display = 'inline-block';
  }

  updateRentalStatus();
}

async function rentVehicle() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const vehicle = vehicleSelect.value;

  if (!selectedStationId || !vehicle) {
    alert('Please select a station and vehicle.');
    return;
  }

  const userLocation = userMarker.getPosition();
  const stationLocation = stations.find(station => station.id === selectedStationId);
  const distance = google.maps.geometry.spherical.computeDistanceBetween(userLocation, new google.maps.LatLng(stationLocation.lat, stationLocation.lng));

  if (distance > RENT_THRESHOLD) {
    alert('You must be within 50 meters of the station to rent a vehicle.');
    return;
  }

  const studentId = 'YOUR_STUDENT_ID';  // Replace with actual student ID

  try {
    await axios.post('/rentals/rent', {
      student_id: studentId,
      vehicle_id: vehicle,
      station_id: selectedStationId
    });

    alert(`You have rented a ${vehicle} from ${stations.find(station => station.id === selectedStationId).name}.`);
    document.getElementById('vehicleSelect').style.display = 'none';
    document.getElementById('stationSelect').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
    rentalEndTime = new Date(Date.now() + 20 * 60 * 1000); // Set rental end time to 20 minutes from now
    updateControls();

    document.getElementById('rentButton').style.display = 'none';
    document.getElementById('returnButton').style.display = 'inline-block';
  } catch (error) {
    console.error('Error renting vehicle:', error);
    alert('Failed to rent vehicle. Please try again.');
  }
}

async function returnVehicle() {
  try {
    await axios.post('/rentals/return', {
      student_id: 'YOUR_STUDENT_ID', // Replace with actual student ID
      station_id: selectedStationId
    });

    alert(`You have returned the vehicle to ${stations.find(station => station.id === selectedStationId).name}.`);
    document.getElementById('vehicleSelect').style.display = 'none';
    document.getElementById('stationSelect').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
    document.getElementById('rentButton').style.display = 'none';
    document.getElementById('returnButton').style.display = 'none';
    selectedStationId = null;
    rentalEndTime = null;
    updateControls();
  } catch (error) {
    console.error('Error returning vehicle:', error);
    alert('Failed to return vehicle. Please try again.');
  }
}

function updateRentalStatus() {
  const rentalStatus = document.getElementById('rentalStatus');
  const timer = document.getElementById('timer');

  if (rentalEndTime) {
    const now = new Date();
    const timeRemaining = Math.max(0, rentalEndTime - now);

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    timer.textContent = `${minutes}m ${seconds}s`;

    if (timeRemaining <= 0) {
      alert('Your rental period has ended.');
      returnVehicle(); // Automatically return vehicle if rental period ends
    }
  } else {
    timer.textContent = 'No rental in progress';
  }
}

// Update rental status every second
setInterval(updateRentalStatus, 1000);

// Initialize map and fetch stations on page load
window.onload = fetchStations;
window.onload = initMap;
