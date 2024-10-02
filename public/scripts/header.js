const dropdownButton = document.getElementById('dropdown-button');
const dropdownMenu = document.getElementById('dropdown-menu');

dropdownButton.addEventListener('click', function () {
    if (dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    } else {
        dropdownMenu.style.display = 'block';
    }
});

window.addEventListener('click', function (event) {
    if (!event.target.closest('.dropdown') && dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    }
});
