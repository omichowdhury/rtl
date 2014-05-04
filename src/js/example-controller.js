var app = angular.module("App", ['google-maps']);

app.controller("ExampleController", function($scope) {

	if (!window.location.hash) {
		var newhash = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
		window.location = '/#'+newhash;
	}

	var getName = function() {
		console.log("NOT LOADED");
	}

	require(["esri/tasks/locator", "esri/geometry/Point"], function(Locator, Point) {
		var locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");

		getName = function(lat, lng, callback, err) {
			locator.locationToAddress(new Point(lng, lat), 5000, callback, err);
		}
	});

	var distanceService = new google.maps.DistanceMatrixService();

	var directionsService = new google.maps.DirectionsService();

	var getDrive = function(orig, dest, callback) {
		distanceService.getDistanceMatrix({
			origins: [
				new google.maps.LatLng(orig.latitude, orig.longitude)
			],
			destinations: [
				new google.maps.LatLng(dest.latitude, dest.longitude)
			],
			travelMode: google.maps.TravelMode.DRIVING
		}, callback);
	}

	var directionsDisplay = new google.maps.DirectionsRenderer({preserveViewport: true});

	$scope.$watch("markers", function(newValue, oldValue) {
		console.log("WAIT");

		if (newValue.length > 1) {
			var orig = newValue[0];
			var dest = newValue[newValue.length - 1];

			var request = {
				origin: new google.maps.LatLng(orig.latitude, orig.longitude),
				destination: new google.maps.LatLng(dest.latitude, dest.longitude),
				travelMode: google.maps.TravelMode.DRIVING
			};
			if(newValue.length > 2) {
				var waypoints = [];
				for (var i = newValue.length - 2; i >= 2; i--) {
					waypoints.push({
						location: new google.maps.LatLng(newValue[i]["latitude"], newValue[i]["longitude"])
					})
				};
			}
			directionsService.route(request, function(result, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(result);
				}
			});
		}


	}, true);

	var onFakeClick = function(mapModel, eventName, originalEventArgs) {
		doubleClicked = false;
		window.setTimeout(function() {
			if (!doubleClicked) {
				onMapClick(mapModel, eventName, originalEventArgs);
			}
		}, 250);
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
			});

			var id = len - 1;

			getName(lat, lng, function(evt) {
				$scope.$apply(function() {
					$scope.markers[id].message = evt.address.City;
				});
			}, function(evt) {
				$scope.$apply(function() {
					$scope.markers[id].message = "Could not locate";
				})
			});

			if (id > 0) {
				$scope.markers[id].distance = "Routing";
				getDrive($scope.markers[id], $scope.markers[id - 1], function(evt) {
					console.log(evt)
					var distance = evt.rows[0]["elements"][0]["duration"]["text"];
					console.log(distance);
					$scope.$apply(function() {
						$scope.markers[id].distance = distance;
					});
				});

			}
		});


		console.log(lat, lng);

	}

	var doubleClicked = false;

	angular.extend($scope, {
		center: {
			latitude: 45,
			longitude: -73
		},
		zoom: 8,
		markers: [],
		events: {
			click: onFakeClick,
			tilesloaded: function(map) {
				$scope.$apply(function() {
					$scope.googleMap = map;
					directionsDisplay.setMap(map);
				});

				google.maps.event.addListener(map, 'dblclick', function(event) { 
					doubleClicked = true;
				});

			}
		}
	});
	var lastIndex = 0;

	var liveMarkers = [];


	sharejs.open('rtlmarkers_'+window.location.hash.substr(1), 'json', 'http://roadtriplab.com:8000/channel', function (error, doc) {

		if (doc.created) {
			console.log("creating document");
			doc.set($scope.markers, function() {});
		} else {
			console.log("document exists");
			console.log(doc);
			$scope.$apply(function() {
				$scope.markers = doc.get();
			});
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

	$('.angular-google-map-container').height(window.innerHeight);
	window.onresize = function() {
		$('.angular-google-map-container').height(window.innerHeight);
	}

});
