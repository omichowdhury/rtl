var app = angular.module("App", ['google-maps', 'ui.sortable']);

app.controller("ExampleController", function($scope) {

	if (!window.location.hash) {
		var newhash = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
		window.location = '/#' + newhash;
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

	var routingBusy = [];
	var directionsPageSize = 7;
	var directionsRendererCount = 3;

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
	var directionsDisplays = new Array();
	var directionsColors = ['#0000FF', '#00FF00', '#FFFF00', '#FF0000'];
	for (var i = 0; i < directionsRendererCount; i++) {
		var directionsDisplay = new google.maps.DirectionsRenderer({preserveViewport: true, suppressMarkers: true, polylineOptions:{strokeColor: directionsColors[i]}});
		directionsDisplays.push(directionsDisplay);
	}


	$scope.$watch("markers", function(newValue, oldValue) {
		console.log("WAIT");

		for (d in directionsDisplays) {
			directionsDisplays[d].setMap(null);
		}


		if (newValue.length > 1) {

		var numPages = Math.ceil((newValue.length - 1) / (directionsPageSize - 1));
		for (var j = 0; j < numPages; j++) {
			var origidx = j * (directionsPageSize - 1);
			var orig = newValue[origidx];
			var destidx = (j < numPages - 1) ? (j + 1) * (directionsPageSize - 1) : newValue.length - 1;
				//(j < numPages - 1) ? ((j+1) * directionsPageSize) - 1 : newValue.length - 1;
			var dest = newValue[destidx];


console.log("origidx", origidx, "destidx", destidx);
			//var orig = newValue[0];
			//var dest = newValue[newValue.length - 1];

			var request = {
				origin: new google.maps.LatLng(orig.latitude, orig.longitude),
				destination: new google.maps.LatLng(dest.latitude, dest.longitude),
				travelMode: google.maps.TravelMode.DRIVING
			};

			var waypoints = [];
			if(destidx - origidx > 1 /*newValue.length > 2*/) {
				for (var i = origidx + 1; i < destidx; i++) {
console.log("waypoint", i);
					waypoints.push({
						location: new google.maps.LatLng(newValue[i]["latitude"], newValue[i]["longitude"])
					})
				};
			}
			request.waypoints = waypoints;

			routingBusy[j] = true;
			setTimeout(function() { routingBusy = false; }, 5000);
			directionsService.route(request, (function(inj) {
				return function(result, status) {
					if (status == google.maps.DirectionsStatus.OK) {
						routingBusy[inj] = false;
						directionsDisplays[inj].setMap($scope.googleMap);
						directionsDisplays[inj].setDirections(result);
					}
				};
			})(j));






		}



		}


			// for (var i = 1; i < newValue.length; i++) {
			// 	var prev = newValue[i].prev;
			// 	var newPrev = newValue[i - 1];
			// 	newValue[i].distance = "Routing";
			// 	getDrive(newValue[i], newValue[i - 1], function(evt) {
			// 		var distance = evt.rows[0]["elements"][0]["duration"]["text"];
			// 		$scope.$apply(function() {
			// 			if($scope.markers[i]) {
			// 				$scope.markers[i].distance = distance;
			// 			}

			// 		});
			// 	});

			// };
		}



	}, true);

	$scope.removeMarker = function(index) {
		console.log($scope.markers);
		$scope.markers.splice(index, 1);
		if ($scope.markers.length > 1) {
			$scope.markers[index].distance = "Routing";
			getDrive($scope.markers[index], $scope.markers[index - 1], function(evt) {
				var distance = evt.rows[0]["elements"][0]["duration"]["text"];
				$scope.$apply(function() {
					$scope.markers[index].distance = distance;
				});
			});
		}
		console.log($scope.markers);
	}

	$scope.getBg = function(index) {
		var marker = $scope.markers[index]
		return {
			"background": "linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url('http://maps.googleapis.com/maps/api/streetview?size=400x150&location=" + marker.address.Address + ", " + marker.address.Region + "&key=AIzaSyBPmj4gI660Fik3oOkxYzWpEM6CdrBCsNk&sensor=true')",
			"background-repeat": "no-repeat",
			"background-size": "cover"

		}
	}


	var onFakeClick = function(mapModel, eventName, originalEventArgs) {
		for (r in routingBusy)
			if (routingBusy[r]) 
				return;

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
					$scope.markers[id].address = evt.address;

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
					var distance = evt.rows[0]["elements"][0]["duration"]["text"];
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
		drives: [],
		events: {
			click: onFakeClick,
			tilesloaded: function(map) {
				$scope.$apply(function() {
					$scope.googleMap = map;
				});

				google.maps.event.addListener(map, 'dblclick', function(event) {
					doubleClicked = true;
				});

			}
		},
		sortableOptions: {
			update: function(e, ui) {

				if ($scope.markers.length > 0) {
					$scope.$apply(function() {
						$scope.markers[0].distance = null;
					});
					for (var index = 1; index < $scope.markers.length; index++) {
						$scope.markers[index].distance = "Routing";
						(function(i) { 
							getDrive($scope.markers[i], $scope.markers[i - 1], function(evt) {
								var distance = evt.rows[0]["elements"][0]["duration"]["text"];
								$scope.$apply(function() {
									$scope.markers[i].distance = distance;
								});
							})
						})(index);
					};

				}
			}
		},
		markerOptions : {
		}
	});
	var lastIndex = 0;

	var liveMarkers = [];


	sharejs.open('rtlmarkers_' + window.location.hash.substr(1), 'json', 'http://roadtriplab.com:8000/channel', function(error, doc) {

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
