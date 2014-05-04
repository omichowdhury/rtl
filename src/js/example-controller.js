var app = angular.module("App", ['google-maps']);

app.controller("ExampleController", function($scope) {

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

	var getDrive = function(orig, dest, callback) {
		service.getDistanceMatrix({
			origins: [
				new google.maps.LatLng(orig.lat, orig.lng)
			],
			destinations: [
				new google.maps.LatLng(dest.lat, dest.lng)
			],
			travelMode: google.maps.TravelMode.DRIVING
		}, callback);
	}

	var onMapClick = function(mapModel, eventName, originalEventArgs) {
		var e = originalEventArgs[0];

		var lat = e.latLng.lat();
		var lng = e.latLng.lng();

		var index = lastIndex + 1;


		$scope.$apply(function() {
			var len = $scope.markers.push({
				latitude: lat,
				longitude: lng,
				message: "Locating",
				distance: "Routing"
			});

			var id = len - 1;

			getName(lat, lng, function(evt) {
				$scope.markers[id].message = evt.address.City;
			}, function(evt) {
				$scope.markers[id].message = "Could not locate";
			});

			if (id > 0) {
				getDrive($scope.markers[id], $scope.markers[id - 1], function(evt) {
					console.log(evt)
					var distance = evt.rows[0]["elements"][0]["duration"]["text"];
					console.log(distance);
					$scope.markers[id].distance = distance;

				})
			}
		});


		console.log(lat, lng);

	}
	angular.extend($scope, {
		center: {
			latitude: 45,
			longitude: -73
		},
		zoom: 8,
		markers: [{
			latitude: 44.75842512584765,
			longitude: -71.31773341738153
		}],
		events: {
			click: onMapClick
		}
	});
	var lastIndex = 0;


});