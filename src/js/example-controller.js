var app = angular.module("App", ["leaflet-directive"]);

app.controller("ExampleController", function ($scope, $timeout, $log) {
  
    // Enable the new Google Maps visuals until it gets enabled by default.
    // See http://googlegeodevelopers.blogspot.ca/2013/05/a-fresh-new-look-for-maps-api-for-all.html

	angular.extend($scope, {
	  	tiles: {
	  		tileLayer: "http://a.tiles.mapbox.com/v3/examples.map-0l53fhk2.json"
	  	},
		center: {
	        lat: 40.095,
	        lng: -3.823,
	        zoom: 1
    	}
	});
});
