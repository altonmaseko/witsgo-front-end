const dropdownButton = document.getElementsByClassName('dropbtn')[0]; // Access the first element
const dropdownMenu = document.getElementsByClassName('dropdown-content')[0]; // Access the first element

dropdownButton.addEventListener('click', function () {
    // Check if dropdownMenu exists before accessing style
    if (dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    } else {
        dropdownMenu.style.display = 'block';
    }
});

window.addEventListener('click', function (event) {
    // Check if dropdownMenu exists before accessing style
    if (!event.target.closest('.dropdown') && dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    }
});
