// let map;
// let stationMarkers = [];
// const DISTANCE_THRESHOLD = 150; // meters
// const RENT_THRESHOLD = 50; // meters
// let selectedStation = null;
// let rentedVehicle = null;

// window.onload = initMap;
// const defaultLocation = {
//   lat: -26.1929,
//   lng: 28.0283
// };
// // Initialize the Google Map
// function initMap() {
//     map = new google.maps.Map(document.getElementById('map'), {
//         center: { lat: -26.1929, lng: 28.0283 }, // Wits University coordinates
//         zoom: 16
//     });

//     // Get user's location and show nearby stations
//     navigator.geolocation.getCurrentPosition((position) => {
//         const userLocation = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude
//         };

//         showNearbyStations(defaultLocation);
//     }, (error) => {
//         console.error('Error getting user location:', error);
//     });
// }

// // Show nearby stations based on user's current location
// function showNearbyStations(userLocation) {
//     // Clear previous markers
//     stationMarkers.forEach((marker) => marker.setMap(null));
//     stationMarkers = [];

//     // Fetch stations data from the backend
//     axios.get('/api/stations')
//         .then((response) => {
//             const stations = response.data;

//             stations.forEach((station) => {
//                 const stationLocation = new google.maps.LatLng(station.lat, station.lng);
//                 const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
//                 const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLocation);

//                 if (distance <= DISTANCE_THRESHOLD) {
//                     const stationMarker = new google.maps.Marker({
//                         position: { lat: station.lat, lng: station.lng },
//                         map: map,
//                         title: `${station.name} - Scooters: ${station.scooter_count}, Bicycles: ${station.bicycle_count}, Skateboards: ${station.skateboard_count}`,
//                         icon: {
//                             url: station.icon,
//                             scaledSize: new google.maps.Size(40, 40) // Resize icon
//                         }
//                     });

//                     // Add click listener for the marker
//                     google.maps.event.addListener(stationMarker, 'click', function () {
//                         selectStation(station.id, userLocation);
//                     });

//                     stationMarkers.push(stationMarker);
//                 }
//             });
//         })
//         .catch((error) => {
//             console.error('Error fetching stations:', error);
//         });
// }

// // Select a station when the marker is clicked
// function selectStation(stationId, userLocation) {
//     // Fetch station's vehicle data
//     axios.get(`/api/stations/${stationId}/vehicles`)
//         .then((response) => {
//             const station = response.data;
//             const stationLocation = new google.maps.LatLng(station.lat, station.lng);
//             const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
//             const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLocation);

//             // Check if the user is close enough to rent/return
//             if (distance <= RENT_THRESHOLD) {
//                 displayStationDropdown(station);
//             } else {
//                 alert('You must be within 50 meters of the station to rent or return a vehicle.');
//             }
//         })
//         .catch((error) => {
//             console.error('Error fetching station vehicles:', error);
//         });
// }

// // Display the station dropdown with vehicles and actions
// function displayStationDropdown(station) {
//     const dropdown = document.getElementById('stationDropdown');
//     dropdown.innerHTML = ''; // Clear previous options

//     const select = document.createElement('select');
//     const defaultOption = document.createElement('option');
//     defaultOption.text = 'Please select a vehicle';
//     defaultOption.value = '';
//     select.appendChild(defaultOption);

//     // Add available vehicles to the dropdown
//     station.vehicles.forEach((vehicle) => {
//         if (vehicle.status === 'available') {
//             const option = document.createElement('option');
//             option.text = `${vehicle.type} (${vehicle.count} available)`;
//             option.value = vehicle.id;
//             select.appendChild(option);
//         }
//     });

//     // Create rent button
//     const rentButton = document.createElement('button');
//     rentButton.textContent = 'Rent Vehicle';
//     rentButton.disabled = true;

//     // Create cancel button
//     const cancelButton = document.createElement('button');
//     cancelButton.textContent = 'Cancel';

//     // Enable rent button when a vehicle is selected
//     select.addEventListener('change', (e) => {
//         rentedVehicle = e.target.value;
//         rentButton.disabled = !rentedVehicle;
//     });

//     // Rent vehicle action
//     rentButton.addEventListener('click', () => {
//         if (rentedVehicle) {
//             rentVehicle(station.id, rentedVehicle);
//         }
//     });

//     // Cancel action
//     cancelButton.addEventListener('click', () => {
//         rentedVehicle = null;
//         dropdown.innerHTML = ''; // Clear dropdown
//     });

//     dropdown.appendChild(select);
//     dropdown.appendChild(rentButton);
//     dropdown.appendChild(cancelButton);
// }

// // Rent a vehicle
// function rentVehicle(stationId, vehicleId) {
//     axios.post(`/api/rent`, { stationId, vehicleId })
//         .then((response) => {
//             alert('Vehicle rented successfully!');
//             rentedVehicle = null;

//             // Disable the station and vehicle selection during the rental
//             document.getElementById('stationDropdown').innerHTML = ''; // Clear dropdown
//             showNearbyStations(userLocation); // Refresh available vehicles and stations
//         })
//         .catch((error) => {
//             console.error('Error renting vehicle:', error);
//         });
// }
// OLD ONE
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