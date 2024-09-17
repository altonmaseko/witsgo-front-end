const DISTANCE_THRESHOLD = 150; // meters to show stations
const RENT_THRESHOLD = 50; // meters to rent or return a vehicle

const stations = [
  { id: 'station1', name: 'Station 1', lat: -26.192082, lng: 28.026229, icon: 'images/station.png' },
  { id: 'station2', name: 'Station 2', lat: -26.1906, lng: 28.0268, icon: 'images/station.png' },
  { id: 'station3', name: 'Station 3', lat: -26.190, lng: 28.027, icon: 'images/station.png' },
  { id: 'station4', name: 'Station 4', lat: -26.189, lng: 28.029, icon: 'images/station.png' },
  { id: 'station5', name: 'Station 5', lat: -26.192, lng: 28.029, icon: 'images/station.png' },
  { id: 'station6', name: 'Station 6', lat: -26.192, lng: 28.032, icon: 'images/station.png' }
];

const vehicleAvailability = {
  station1: {bicycle: 5, scooter: 3, skateboard: 7 },
  station2: {bicycle: 2, scooter: 6, skateboard: 1 },
  station3: {bicycle: 4, scooter: 2, skateboard: 3 },
  station4: {bicycle: 3, scooter: 1, skateboard: 5 },
  station5: {bicycle: 1, scooter: 4, skateboard: 2 },
  station6: {bicycle: 7, scooter: 3, skateboard: 6 }
};

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

  const stationSelect = document.getElementById('stationSelect');
  const vehicleSelect = document.getElementById('vehicleSelect');
  const cancelButton = document.getElementById('cancelButton');

  const vehicles = vehicleAvailability[stationId] || {};
  stationSelect.innerHTML = ''; // Clear previous options

  if (Object.keys(vehicles).length > 0) {
    Object.keys(vehicles).forEach(vehicleId => {
      const option = document.createElement('option');
      option.value = vehicleId;
      option.textContent = `${vehicleId.charAt(0).toUpperCase() + vehicleId.slice(1)} (${vehicles[vehicleId]})`;
      stationSelect.appendChild(option);
    });

    stationSelect.style.display = 'block';
    vehicleSelect.style.display = 'none';
    cancelButton.style.display = 'inline-block';
  } else {
    alert('No vehicles available at this station.');
  }
}

function showVehicleDropdown() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const stationSelect = document.getElementById('stationSelect');
  const selectedVehicle = stationSelect.value;

  if (selectedStationId && selectedVehicle) {
    const vehicles = vehicleAvailability[selectedStationId] || {};
    vehicleSelect.innerHTML = ''; // Clear previous options
    Object.keys(vehicles).forEach(vehicleId => {
      const option = document.createElement('option');
      option.value = vehicleId;
      option.textContent = `${vehicleId.charAt(0).toUpperCase() + vehicleId.slice(1)} (${vehicles[vehicleId]})`;
      vehicleSelect.appendChild(option);
    });

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

function rentVehicle() {
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

  // Example logic for renting the vehicle
  console.log(`Renting ${vehicle} from station ${selectedStationId} for student ${studentId}`);
  alert(`You have rented a ${vehicle} from ${stations.find(station => station.id === selectedStationId).name}.`);

  // Disable vehicle selection and update the control
  document.getElementById('vehicleSelect').style.display = 'none';
  document.getElementById('stationSelect').style.display = 'none';
  document.getElementById('cancelButton').style.display = 'none';
  rentalEndTime = new Date(Date.now() + 20 * 60 * 1000); // Set rental end time to 20 minutes from now
  updateControls();

  // Only show the return button after renting
  document.getElementById('rentButton').style.display = 'none';
  document.getElementById('returnButton').style.display = 'inline-block';
}

function returnVehicle() {
  // Example logic for returning the vehicle
  console.log(`Returning vehicle to station ${selectedStationId}`);
  alert(`You have returned the vehicle to ${stations.find(station => station.id === selectedStationId).name}.`);

  // Reset the selection
  document.getElementById('vehicleSelect').style.display = 'none';
  document.getElementById('stationSelect').style.display = 'none';
  document.getElementById('cancelButton').style.display = 'none';
  document.getElementById('rentButton').style.display = 'none';
  document.getElementById('returnButton').style.display = 'none';
  selectedStationId = null;
  rentalEndTime = null;
  updateControls();
}

function updateRentalStatus() {
  const rentalStatus = document.getElementById('rentalStatus');
  const timer = document.getElementById('timer');

  if (rentalEndTime) {
    const now = new Date();
    const timeRemaining = Math.max(0, rentalEndTime - now);

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    rentalStatus.style.display = 'block';

    setTimeout(updateRentalStatus, 1000);
  } else {
    rentalStatus.style.display = 'none';
  }
}

function testLocations() {
  testLocation = { lat: -26.191, lng: 28.027 }; // Example test location
  updateUserLocation(testLocation);
  showNearbyStations(testLocation);
}

testLocations(); // Set test location to default center
window.onload = initMap;
