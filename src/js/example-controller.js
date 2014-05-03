var app = angular.module("App", ["leaflet-directive"]);

app.controller("ExampleController", function($scope, leafletEvents, $log) {

	var getName = function() {
		console.log("NOT LOADED");
	}

	require(["esri/tasks/locator", "esri/geometry/Point"], function(Locator, Point) {
		var locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");

		getName = function(lat, lng, callback, err) {
			locator.locationToAddress(new Point(lng, lat), 5000, callback, err);
		}
	});

	var service = new google.maps.DistanceMatrixService();

	getDrive = function (orig, dest, callback) {
		service.getDistanceMatrix(
		  {
		    origins: [
		    	new google.maps.LatLng(orig.lat, orig.lng)
		    ],
		    destinations: [
		    	new google.maps.LatLng(dest.lat, dest.lng)
		    ],
		    travelMode: google.maps.TravelMode.DRIVING
		  }, callback);
	}

	angular.extend($scope, {
		tiles: {
			tileLayer: "http://a.tiles.mapbox.com/v3/examples.map-0l53fhk2.json"
		},
		center: {
			lat: 40.095,
			lng: -3.823,
			zoom: 10
		},
		markers: [],
		events: {
			map: {
				enable: ['zoomstart', 'drag', 'click', 'mousemove'],
				logic: 'emit'
			}
		}
	});
	var lastIndex = 0;

	$scope.eventDetected = "No events yet...";

	$scope.$on('leafletDirectiveMap.click', function(event, leafletEvent) {
		console.log("CLICL", leafletEvent);
		$scope.eventDetected = "Click";
		var lat = leafletEvent.leafletEvent.latlng.lat;
		var lng = leafletEvent.leafletEvent.latlng.lng;
		var index = lastIndex + 1;

		var len = $scope.markers.push({
			lat: lat,
			lng: lng,
			message: "Locating...",
			message: "Routing...",
			focus: true,
			draggable: true
		});

		var id = len - 1;

		getName(lat, lng, function(evt) {
			$scope.markers[id].message = evt.address.City;
		}, function(evt) {
			$scope.markers[id].message = "Could not locate";
		});

		if(id > 0) {
			getDrive($scope.markers[id],$scope.markers[id-1], function (evt) {
				console.log(evt)
				var distance = evt.rows[0]["elements"][0]["duration"]["text"];
				console.log(distance);
				$scope.markers[id].distance = distance;
			
			})
		}


	});
});