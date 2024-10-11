let scheduleData = []; // Store the full schedule data

document.addEventListener('DOMContentLoaded', () => {
    fetchBusSchedule();
    
    // Add event listeners for filters
    document.getElementById('days').addEventListener('change', toggleSchedule);
    document.getElementById('destination').addEventListener('change', filterRoutesByDestination);
});

async function fetchBusSchedule() {
    try {
        const response = await fetch('/api/bus-schedule');
        if (!response.ok) {
            throw new Error('Failed to fetch bus schedule');
        }
        scheduleData = await response.json();
        populateSchedule(scheduleData);
        initializeFilters(); // Initialize filters after data is loaded
    } catch (error) {
        console.error('Error:', error);
        // Handle error (e.g., display error message to user)
    }
}

function populateSchedule(data) {
    const weekdaySchedule = document.getElementById('weekday-schedule').querySelector('tbody');
    const weekendSchedule = document.getElementById('weekend-schedule').querySelector('tbody');

    weekdaySchedule.innerHTML = '';
    weekendSchedule.innerHTML = '';

    data.forEach(route => {
        const isWeekend = route.name.toLowerCase().includes('weekend') || route.name.includes('6');
        const targetSchedule = isWeekend ? weekendSchedule : weekdaySchedule;

        route.details.forEach((detail, index) => {
            const row = document.createElement('tr');
            row.className = index === 0 ? 'route-header' : 'route-details hidden';
            row.innerHTML = `
                <td>${index === 0 ? `<span class="arrow">&#9654;</span> ${route.name}` : ''}</td>
                <td>${detail.route}</td>
                <td>${detail.time}</td>
                <td>${detail.interval}</td>
            `;
            if (index === 0) {
                row.onclick = () => toggleDetails(row);
            }
            targetSchedule.appendChild(row);
        });
    });
}

function initializeFilters() {
    // Populate destination dropdown
    const destinationDropdown = document.getElementById('destination');
    const destinations = new Set();
    scheduleData.forEach(route => {
        route.details.forEach(detail => {
            detail.route.split('>').forEach(stop => {
                destinations.add(stop.trim());
            });
        });
    });
    destinations.forEach(destination => {
        const option = document.createElement('option');
        option.value = destination;
        option.textContent = destination;
        destinationDropdown.appendChild(option);
    });

    // Initial filter application
    toggleSchedule();
}

function toggleSchedule() {
    const daysDropdown = document.getElementById('days');
    const weekdaySchedule = document.getElementById('weekday-schedule');
    const weekendSchedule = document.getElementById('weekend-schedule');
    const rosebankOption = document.getElementById('rosebank-option');

    if (daysDropdown.value === 'Week') {
        weekdaySchedule.classList.remove('hidden');
        weekendSchedule.classList.add('hidden');
        rosebankOption.disabled = true;
    } else {
        weekdaySchedule.classList.add('hidden');
        weekendSchedule.classList.remove('hidden');
        rosebankOption.disabled = false;
    }

    filterRoutesByDestination();
}

function filterRoutesByDestination() {
    const destinationDropdown = document.getElementById('destination');
    const selectedDestination = destinationDropdown.value;
    const weekdaySchedule = document.getElementById('weekday-schedule');
    const weekendSchedule = document.getElementById('weekend-schedule');

    const visibleSchedule = weekdaySchedule.classList.contains('hidden') ? weekendSchedule : weekdaySchedule;
    const rows = visibleSchedule.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const routeDetailsCell = row.cells[1];
        if (routeDetailsCell) {
            const routeDetails = routeDetailsCell.textContent;

            if (selectedDestination === '' || routeDetails.includes(selectedDestination)) {
                row.classList.remove('hidden');
                row.style.display = 'table-row';

                if (row.classList.contains('route-header')) {
                    expandDetails(row);
                }

                if (selectedDestination !== '') {
                    highlightDestination(routeDetailsCell, selectedDestination);
                }
            } else {
                row.classList.add('hidden');
                row.style.display = 'none';
            }
        }
    });
}

function expandDetails(row) {
    let nextRow = row.nextElementSibling;
    while (nextRow && nextRow.classList.contains('route-details')) {
        nextRow.classList.remove('hidden');
        nextRow.style.display = 'table-row';
        nextRow = nextRow.nextElementSibling;
    }
    row.classList.add('expanded');
}

function highlightDestination(cell, destination) {
    const regex = new RegExp(destination, 'gi');
    const originalText = cell.textContent;
    const highlightedText = originalText.replace(regex, match => `<span class="highlight">${match}</span>`);
    cell.innerHTML = highlightedText;
}

function toggleDetails(row) {
    let nextRow = row.nextElementSibling;
    while (nextRow && nextRow.classList.contains('route-details')) {
        nextRow.style.display = (nextRow.style.display === 'table-row') ? 'none' : 'table-row';
        nextRow = nextRow.nextElementSibling;
    }
    row.classList.toggle('expanded');
}