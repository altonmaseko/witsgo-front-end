let timerInterval;
let rentalEndTime = 0;

const vehicleAvailability = {
    bicycleOpt: 5,
    scooterOpt: 3,
    skateboardOpt: 7
};

function initMap() 
{
    var location = { lat: -34.397, lng: 150.644 };

    var map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 8
    });

    var marker = new google.maps.Marker({
        position: location,
        map: map
    });
}

function updateControls() 
{
    var select = document.getElementById('vehicleSelect');
    var rentButton = document.getElementById('rentButton');
    var availability = document.getElementById('availability');
    var vehicle = select.value;

    if (vehicle && !rentalEndTime) 
    {
        rentButton.style.display = 'inline-block';
        availability.textContent = `Available: ${vehicleAvailability[vehicle] || 0}`;
    } 
    else if (rentalEndTime) 
    {
        rentButton.style.display = 'none';
        availability.textContent = ''; // Hide availability when timer is active
    } 
    else 
    {
        rentButton.style.display = 'none';
        availability.textContent = 'Select a vehicle to see availability';
    }
}

function rentVehicle() 
{
    var select = document.getElementById('vehicleSelect');
    var vehicle = select.value;

    if (!vehicle) return;

    //Decreases availability
    vehicleAvailability[vehicle] = Math.max(0, vehicleAvailability[vehicle] - 1);

    //Hide the rent button and update availability display
    document.getElementById('rentButton').style.display = 'none';
    document.getElementById('availability').textContent = ''; 
    // Hide availability when timer starts

    //Show rental status and return button
    var rentalStatus = document.getElementById('rentalStatus');
    rentalStatus.style.display = 'block';
    document.getElementById('returnButton').style.display = 'inline-block';

    startTimer();

    document.getElementById('vehicleSelect').disabled = true;
}

function startTimer() 
{
    var timerDisplay = document.getElementById('timer');
    var endTime = new Date().getTime() + 30 * 60 * 1000; // 30 minutes from now

    function updateTimer() 
    {
        var now = new Date().getTime();
        var timeLeft = endTime - now;

        if (timeLeft <= 0) 
        {
            clearInterval(timerInterval);
            timerDisplay.textContent = '00:00';
            document.getElementById('returnButton').disabled = false; // Enable return button if time expires
            return;
        }

        var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function returnVehicle() 
{
    var select = document.getElementById('vehicleSelect');
    var vehicle = select.value;

    if (!vehicle) return;

    //Increases availability
    vehicleAvailability[vehicle] = (vehicleAvailability[vehicle] || 0) + 1;

    //Resets UI
    document.getElementById('rentalStatus').style.display = 'none';
    document.getElementById('vehicleSelect').disabled = false;
    rentalEndTime = 0;

    //Clear timer
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '30:00';
    document.getElementById('returnButton').style.display = 'none';
    updateControls();
    //Update controls to show availability after return
}
