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
				new google.maps.LatLng(orig.latitude, orig.longitude)
			],
			destinations: [
				new google.maps.LatLng(dest.latitude, dest.longitude)
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
					$scope.$apply(function() {
						$scope.markers[id].distance = distance;
					});
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
		markers: [],
		events: {
			click: onMapClick
		}
	});
	var lastIndex = 0;

	var liveMarkers = [];

	sharejs.open('rtlmarkers', 'json', 'http://roadtriplab.com:8000/channel', function (error, doc) {

		if (doc.created) {
			console.log("creating document");
			doc.set($scope.markers, function() {});
		} else {
			console.log("document exists");
			console.log(doc);
		}
		liveMarkers = doc;

		doc.on('remoteop', function(op) {
			console.log('remoteop detected', op);
			console.log('updated markers doc', doc);
			$scope.$apply(function() {
				$scope.markers = doc.get();
			});
		});

	});

	$scope.$watch("markers", function(newValue, oldValue) {
		console.log('markers watch?');
		if (oldValue == newValue) return;
		console.log('markers change detected');
		liveMarkers.set(newValue);
	}, true);

});
