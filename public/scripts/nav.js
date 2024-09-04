const searchBtn = document.getElementById("searchBtn");
const navMeBtn = document.getElementById("navBtn");
const profileBtn = document.getElementById("profileBtn");

profileBtn.addEventListener("click", function() {
    window.location.href = "Profile%20Page/profile.html";
});

// initialize map
function initMap(){
    var location = {lat: -26.190697, lng: 28.026110}; // default location (wits)
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: location,
        mapTypeControl: false
    });
    var marker = new google.maps.Marker({
        position: location,
        map: map
    });

    var searchBox = new google.maps.places.SearchBox(document.getElementById('searchInput'));

    // updates the addresses when searching 
    map.addListener('bounds_changed', function(){
        searchBox.setBounds(map.getBounds());
    });

    searchBtn.addEventListener('click', function() {
        var places = searchBox.getPlaces();

        if (places.length === 0) {
            alert('No places found for the given input.');
            return;
        }

        // Clear out the old markers.
        marker.setMap(null);

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds(); // moves the map to the new location/s

        places.forEach(function(place) {
            if (!place.geometry || !place.geometry.location) {
                console.log("Returned place contains no geometry");
                return;
            }

            // Create a marker for each place.
            marker = new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location
            });

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}


