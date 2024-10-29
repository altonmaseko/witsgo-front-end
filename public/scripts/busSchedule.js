import { clientUrl, serverUrl } from "./constants.js";

// Global variables to store schedule data
let weekdayRoutes = [];
let weekendRoutes = [];

// Function to fetch schedule data from server
async function fetchScheduleData() {
    try {
        const response = await axios.get(`${serverUrl}/v1/schedule/api/bus-schedule`);
        const scheduleData = response.data.data;

        // Sort routes into weekday and weekend arrays
        weekdayRoutes = scheduleData.filter(route =>
            !route.name.startsWith('Route 6') &&
            route.name !== 'Route 3C' &&
            route.name !== 'Route 1 - Full Circuit [Weekend]');
        weekendRoutes = scheduleData.filter(route =>
            route.name === 'Route 1 - Full Circuit [Weekend]' ||
            route.name === 'Route 3C' ||
            route.name.startsWith('Route 6')
        );

        // Initialize the schedule display
        await initializeSchedule();
    } catch (error) {
        console.error('Error fetching schedule:', error);
        // You might want to show an error notification here
    }
}

// Function to create a route row
function createRouteRow(route, isHeader = true) {
    const row = document.createElement('tr');
    if (isHeader) {
        row.classList.add('route-header');
        row.onclick = () => toggleDetails(row);
        row.innerHTML = `
            <td><span class="arrow">&#9654;</span> ${route.name}</td>
            <td>${route.details[0].route}</td>
            <td>${route.details[0].time}</td>
            <td>${route.details[0].interval}</td>
        `;
    } else {
        row.classList.add('route-details');
        row.style.display = 'none';
        row.innerHTML = `
            <td></td>
            <td>${route.route}</td>
            <td>${route.time}</td>
            <td>${route.interval}</td>
        `;
    }
    return row;
}

// Function to populate schedule tables
function populateScheduleTables() {
    const weekdayTbody = document.querySelector('#weekday-schedule tbody');
    const weekendTbody = document.querySelector('#weekend-schedule tbody');

    weekdayTbody.innerHTML = '';
    weekendTbody.innerHTML = '';

    // Populate weekday schedule
    weekdayRoutes.forEach(route => {
        weekdayTbody.appendChild(createRouteRow(route));
        route.details.slice(1).forEach(detail => {
            weekdayTbody.appendChild(createRouteRow({ ...detail }, false));
        });
    });

    // Populate weekend schedule
    weekendRoutes.forEach(route => {
        weekendTbody.appendChild(createRouteRow(route));
        route.details.slice(1).forEach(detail => {
            weekendTbody.appendChild(createRouteRow({ ...detail }, false));
        });
    });
}

// Toggle route details
function toggleDetails(row) {
    let nextRow = row.nextElementSibling;
    while (nextRow && nextRow.classList.contains('route-details')) {
        nextRow.style.display = (nextRow.style.display === 'table-row') ? 'none' : 'table-row';
        nextRow = nextRow.nextElementSibling;
    }
    row.classList.toggle('expanded');
}

// Toggle between weekday and weekend schedules
function toggleSchedule() {
    const daysDropdown = document.getElementById('days');
    const weekdaySchedule = document.getElementById('weekday-schedule');
    const weekendSchedule = document.getElementById('weekend-schedule');
    const rosebankOption = document.getElementById('rosebank-option');
    const destinationDropdown = document.getElementById('destination');

    if (daysDropdown.value === 'Week') {
        weekdaySchedule.classList.remove('hidden');
        weekendSchedule.classList.add('hidden');
        rosebankOption.disabled = true;
    } else {
        weekdaySchedule.classList.add('hidden');
        weekendSchedule.classList.remove('hidden');
        rosebankOption.disabled = false;
    }

    destinationDropdown.selectedIndex = 0;
    collapseAllDetails();
    filterRoutesByDestination();
}

// Filter routes based on destination
function filterRoutesByDestination() {
    const destinationDropdown = document.getElementById('destination');
    const selectedDestination = destinationDropdown.value;
    const weekdaySchedule = document.getElementById('weekday-schedule');
    const weekendSchedule = document.getElementById('weekend-schedule');

    const visibleSchedule = weekdaySchedule.classList.contains('hidden') ? weekendSchedule : weekdaySchedule;
    const rows = visibleSchedule.querySelectorAll('tbody tr');

    if (!selectedDestination) {
        rows.forEach(row => {
            row.classList.remove('hidden');
            row.style.display = 'table-row';

          
            if (row.classList.contains('route-header')) {
                expandDetails(row);
            }
        });
        return; 
    }

    rows.forEach(row => {
        const routeDetailsCell = row.cells[1];
        if (routeDetailsCell) {
            const routeDetails = routeDetailsCell.textContent;

            if (!selectedDestination || routeDetails.includes(selectedDestination)) {
                row.classList.remove('hidden');
                row.style.display = 'table-row';

                if (row.classList.contains('route-header')) {
                    expandDetails(row);
                }

                if (selectedDestination) {
                    highlightDestination(routeDetailsCell, selectedDestination);
                }
            } else {
                row.classList.add('hidden');
                row.style.display = 'none';
            }
        }
    });
}

// Expand route details
function expandDetails(row) {
    let nextRow = row.nextElementSibling;
    while (nextRow && nextRow.classList.contains('route-details')) {
        nextRow.classList.remove('hidden');
        nextRow.style.display = 'table-row';
        nextRow = nextRow.nextElementSibling;
    }
    row.classList.add('expanded');
}

// Collapse all route details
function collapseAllDetails() {
    const allDetails = document.querySelectorAll('.route-details');
    allDetails.forEach(detailRow => {
        detailRow.classList.add('hidden');
        detailRow.style.display = 'none';
    });

    const allHeaders = document.querySelectorAll('.route-header');
    allHeaders.forEach(headerRow => {
        headerRow.classList.remove('expanded');
    });
}

// Highlight selected destination
function highlightDestination(cell, destination) {
    const regex = new RegExp(destination, 'gi');
    const originalText = cell.textContent;
    const highlightedText = originalText.replace(regex, match => `<span class="highlight">${match}</span>`);
    cell.innerHTML = highlightedText;
}

// Initialize schedule
async function initializeSchedule() {
    await populateScheduleTables();

    // Add event listeners
    document.getElementById('days').addEventListener('change', toggleSchedule);
    document.getElementById('destination').addEventListener('change', filterRoutesByDestination);

    // Initial setup
    collapseAllDetails();
    toggleSchedule();
}

// Initial fetch when page loads
document.addEventListener('DOMContentLoaded', fetchScheduleData);