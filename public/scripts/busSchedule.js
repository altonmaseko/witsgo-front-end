import { serverUrl } from "./constants.js";

// Fetch bus schedule data
async function fetchBusSchedule() {
    try {
        const response = await axios.get(`${serverUrl}/v1/BusSchedule/busSchedule`);
        return response.data;
    } catch (error) {
        console.error("Error fetching bus schedule:", error);
        return null;
    }
}

// Populate schedule tables
function populateScheduleTables(scheduleData) {
    const weekdayTable = document.getElementById('weekday-schedule').querySelector('tbody');
    const weekendTable = document.getElementById('weekend-schedule').querySelector('tbody');
    
    weekdayTable.innerHTML = '';
    weekendTable.innerHTML = '';

    scheduleData.forEach(route => {
        const isWeekend = route.name.toLowerCase().includes('weekend') || route.name.includes('6');
        const targetTable = isWeekend ? weekendTable : weekdayTable;

        const row = createRouteRow(route);
        targetTable.appendChild(row);

        route.details.forEach(detail => {
            const detailRow = createDetailRow(detail);
            targetTable.appendChild(detailRow);
        });
    });
}

function createRouteRow(route) {
    const row = document.createElement('tr');
    row.className = 'route-header';
    row.onclick = () => toggleDetails(row);
    row.innerHTML = `
        <td><span class="arrow">&#9654;</span> ${route.name}</td>
        <td colspan="3"></td>
    `;
    return row;
}

function createDetailRow(detail) {
    const row = document.createElement('tr');
    row.className = 'route-details hidden';
    row.innerHTML = `
        <td></td>
        <td>${detail.route}</td>
        <td>${detail.time}</td>
        <td>${detail.interval}</td>
    `;
    return row;
}

// Toggle route details
function toggleDetails(row) {
    let nextRow = row.nextElementSibling;
    while (nextRow && nextRow.classList.contains('route-details')) {
        nextRow.classList.toggle('hidden');
        nextRow = nextRow.nextElementSibling;
    }
    row.classList.toggle('expanded');
}

// Initialize bus schedule
async function initBusSchedule() {
    const busScheduleData = await fetchBusSchedule();
    if (busScheduleData && busScheduleData.success) {
        populateScheduleTables(busScheduleData.data);
    } else {
        console.error("Failed to fetch bus schedule");
    }
}

// Toggle between weekday and weekend schedules
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

// Filter routes by destination
function filterRoutesByDestination() {
    const destinationDropdown = document.getElementById('destination');
    const selectedDestination = destinationDropdown.value;
    const visibleSchedule = document.getElementById('weekday-schedule').classList.contains('hidden') 
        ? document.getElementById('weekend-schedule') 
        : document.getElementById('weekday-schedule');
    const rows = visibleSchedule.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const routeDetailsCell = row.cells[1];
        if (routeDetailsCell) {
            const routeDetails = routeDetailsCell.textContent;
            if (selectedDestination === '' || routeDetails.includes(selectedDestination)) {
                row.classList.remove('hidden');
                if (row.classList.contains('route-header')) {
                    row.classList.add('expanded');
                }
            } else {
                row.classList.add('hidden');
                if (row.classList.contains('route-header')) {
                    row.classList.remove('expanded');
                }
            }
        }
    });
}

// Window onload function
window.onload = async function () {
    await initBusSchedule();

    // Set up event listeners
    document.getElementById('days').addEventListener('change', toggleSchedule);
    document.getElementById('destination').addEventListener('change', filterRoutesByDestination);

    // Initial toggle and filter
    toggleSchedule();
};