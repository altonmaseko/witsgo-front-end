const dropdownButton = document.getElementById('.dropbtn');
const dropdownMenu = document.getElementById('.dropdown-content');

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
