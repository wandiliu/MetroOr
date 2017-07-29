var travelingAt = [];
var annualDriveTime = [];
var annualTransitTime = [];
var timeTravelArray = [];
var transitTravelArray = [];
var theInput = [];
var theInfo = [];
var notMetro = [];
var times = [];
var home;
var work;
var leaveHome;
var leaveWork;
var latLongHome;
var latLongWork;
var ride = [];
var drive = [];
var monetaryCost;

window.onbeforeunload = function () {
  window.scrollTo(0, 0);
}
function initMap() {

  var map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat:34.0522,lng:-118.2437},
    zoom: 10
  });

  new AutocompleteDirectionsHandler(map);

};

function AutocompleteDirectionsHandler(map) {

  this.map = map;
  this.homePlaceId = null;
  this.destinationPlaceId = null;
  this.travelMode = 'DRIVING';
  //get user input
  home = document.getElementById('home-input');
  work = document.getElementById('work-input');
  leaveHome = document.getElementById('leave-home');
  leaveWork = document.getElementById('leave-work');

  this.directionsService = new google.maps.DirectionsService;
  this.directionsDisplay = new google.maps.DirectionsRenderer({
    //customize render so there's no line drawn and the icon is different
                        polylineOptions : {strokeColor:'rgba(0,0,0,0)'},
                          markerOptions: {
                            icon: 'red.png'
                          }
                        }),

  this.directionsDisplay.setMap(map);

  var homeAutocomplete = new google.maps.places.Autocomplete(
      home, {placeIdOnly: true});
  var workAutocomplete = new google.maps.places.Autocomplete(
      work, {placeIdOnly: true});

  this.setupPlaceChangedListener(homeAutocomplete, 'ORIG');
  this.setupPlaceChangedListener(workAutocomplete, 'DEST');

  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(home);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(work);
}

AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(autocomplete, mode) {
  var me = this;
  autocomplete.bindTo('bounds', this.map);
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (!place.place_id) {
      window.alert("Please select an option from the dropdown list.");
      return;
    }
    if (mode === 'ORIG') {
      me.homePlaceId = place.place_id;
    } else {
      me.workPlaceId = place.place_id;
    }
    me.route();
  });
};

AutocompleteDirectionsHandler.prototype.route = function() {
  if (!this.homePlaceId || !this.workPlaceId) {
    return;
  }
  var me = this;

  this.directionsService.route({
    origin: {'placeId': this.homePlaceId},
    destination: {'placeId': this.workPlaceId},
    travelMode: this.travelMode
  }, function(response, status) {
    if (status === 'OK') {
      me.directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
  //get values from user input
  homeAddress = home.value;
  workAddress = work.value;
  leaveHome = leaveHome.value;
  leaveWork = leaveWork.value;

  //set default times of day
  if (leaveHome.length < 3) {
    leaveHome = "08:00";
  }
  if (leaveWork.length < 3) {
    leaveWork = "18:00";
  };

  function setTimes(time) {
    //divide time input into hours and minutes
    hours = time.slice(0,2);
    minutes = time.slice(3,5);
    //make date the following Wednesday from today
    var nextWednesday = new Date();
    nextWednesday.setDate(nextWednesday.getDate() + (9-nextWednesday.getDay())%7+1);
    //Apply users departure time data to date
    nextWednesday.setHours(hours, minutes);
    travelingAt.push(nextWednesday);

    if (travelingAt.length == 2) {
      timeToWork = travelingAt[0];
      timeToHome = travelingAt[1];
    }
    //adjust time data for 12 hour clock and add AM or PM
    function timeChange (hrs) {
      if (hrs[0] == 1) {
        newHrs = hrs.slice(0,2);
        newHrs = parseInt(newHrs);
        newHrs = "0" + (newHrs - 12);
        min = hrs.slice(2,5);
        hrs = (newHrs + min) + " PM";
      } else {
        hrs = hrs + " AM";
      }
      times.push(hrs);
    }
    timeChange(leaveHome);
    timeChange(leaveWork);

    //set up values for display
    if (times.length == 2) {
      var x = "<br> Home: " + homeAddress.slice(0, -15) + "&nbsp; Leaving for work at: " + times[0]
      theInput.push(x);
      var y = "Work: " + workAddress.slice(0, -15) + "&nbsp; Leaving for home at: " + times[1];
      theInput.push(y);
    }
  }
  setTimes(leaveHome);
  setTimes(leaveWork);

  function modes(theMode, time) {
    //straight from the docs
    var service = new google.maps.DistanceMatrixService;
    service.getDistanceMatrix({
      origins: [homeAddress],
      destinations: [workAddress],
      travelMode: theMode,
      transitOptions: {
        modes: ['RAIL'],
        departureTime: time
      },
      drivingOptions: {
        //best guess or pessimistic?? maybe average them??
        trafficModel: 'pessimistic',
        departureTime: time
      },
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      avoidHighways: false,
      avoidTolls: false

      }, function(response, status) {
        if (status !== 'OK') {
          console.log('Error was: ' + status);
        } else {
        var originList = response.originAddresses;
        var destinationList = response.destinationAddresses;

        for (var i = 0; i < originList.length; i++) {
          var results = response.rows[i].elements;

          //function to put time in hour and minute format
          function convertTime (input) {
            return parseInt(input/60) + ' hour(s) and ' + input%60 + ' minute(s)';
          }
          console.log("results = " + JSON.stringify(results))
          for (var j = 0; j < results.length; j++) {

            var theAddresses = originList[i].slice(0, -15) + ' to ' + destinationList[j].slice(0, -15);
            if (theMode === "DRIVING") {
              var distanceResult = results[j].distance.text;
              //slice " mi" off the distance return value
              var trimDistance = distanceResult.slice(0, -3);
              var theDuration = results[j].duration_in_traffic.text;
              //adjust travel time in traffic from seconds to minutes
              var timeEachWay = (results[j].duration_in_traffic.value / 60).toFixed(0);
              //push travel times each way into array
              timeTravelArray.push(timeEachWay);
              // calculate annual costs of driving using year average of 251 work days
              // and $0.26 cents of wear, tear, and gas
              var cost = (Number(trimDistance) * .26) * 502;
              var lengthDrive = results[j].duration_in_traffic.value
              //calculate annual drive time for each way of commute
              var timeDrive = ((Math.round(lengthDrive*Math.pow(10,2))/Math.pow(10,2)) / 60).toFixed(0);
              var annualHalfDriveTime = Number(timeDrive) * 251;
              //push commute times to a variable
              annualDriveTime.push(annualHalfDriveTime);
              //Once both times are in the array, add commute times for total driving time
              if (annualDriveTime.length == 2) {
                totalAnnualCommuteTime = annualDriveTime[0] + annualDriveTime[1];
                //use convertTime function, store in variables
                var totalTravelTime = convertTime(totalAnnualCommuteTime);
                var commuteToWork = convertTime(annualDriveTime[0]);
                var commuteHome = convertTime(annualDriveTime[1]);
                var timeToWork = convertTime(timeTravelArray[0]);
                var timeToHome = convertTime(timeTravelArray[1]);
                var theDistance = results[j].distance.text;
              }
              //Put costs in decimal format
              monetaryCost = Math.round(cost*Math.pow(10,2))/Math.pow(10,2).toFixed(2)
              //Put distance and times into one variable
              var distanceAndTime = theDistance + ' each way. <br>Home to work in ' +  timeToWork + ". Work to home in " + timeToHome;
            }

            else if (theMode === "TRANSIT") {
              //if there is no transit option:
              if (results[0].status == "ZERO_RESULTS") {
                var distanceAndTime = 0
              }
              // otherwise compute transit time
              else {
                var theDuration = results[j].duration.text;
                var theDistance = results[j].distance.text;

              //adjust travel time in traffic from seconds to minutes
              var oneWayTravel = (results[j].duration.value / 60).toFixed(0);
              //store adjusted
              transitTravelArray.push(oneWayTravel);
              //calculate annual travel time for each way of commute
              var transitTimeOneWay = (Math.round(oneWayTravel*Math.pow(10,2))/Math.pow(10,2))
              var annualTransitOneWay = Number(transitTimeOneWay) * 251;
              var transitTimeOneWay = ((Number(results[j].duration.value) * 251) / 60).toFixed(0);
              //push commute times to a variable
              annualTransitTime.push(annualTransitOneWay);
              }
              //Once both times are in the array, add commute times for total transit time
              if (annualTransitTime.length == 2) {
                totalAnnualCommuteTime = annualTransitTime[0] + annualTransitTime[1];
                //use convertTime function, store in variables
                var totalTravelTime = convertTime(totalAnnualCommuteTime);
                var commuteToWork = convertTime(annualTransitTime[0]);
                var commuteHome = convertTime(annualTransitTime[1]);
                var timeToWork = convertTime(transitTravelArray[0]);
                var timeToHome = convertTime(transitTravelArray[1]);
              }
              var distanceAndTime = theDistance + ' each way.<br>Home to work in ' +  timeToWork + ". Work to home in " + timeToHome;
            }
          }
        }
      }
      //set up data for display
      if ((totalTravelTime && timeToHome) && (annualTransitTime.length == 2 || annualDriveTime.length == 2)) {
        var a = ("<br>" + theMode + ": approximately " + distanceAndTime);
        theInfo.push(a);
        var b = ("<br>Total commute: " + totalTravelTime + " per year.");
        theInfo.push(b);
      }

      if (theInfo.length) {
        var which = theInfo[0].slice(4,11);

        if (!(results[0].status == "ZERO_RESULTS") && theInfo.length == 4 && which == "DRIVING") {
          var dist = results[0].distance.text
          var newDist = dist.slice(0,2);
          var numDist = parseInt(newDist);

          drive.push(theInfo[0]);
          drive.push(theInfo[1]);
          if (results[0].distance.value > 100 ) {
          ride.push(theInfo[2]);
          ride.push(theInfo[3]);
        }
        else {
          ride = "TRANSIT: There are no public transit options for your chosen route.";
        }
      }
      else if (theInfo.length == 4 && which == "TRANSIT"){
        ride.push(theInfo[0]);
        ride.push(theInfo[1]);
        drive.push(theInfo[2]);
        drive.push(theInfo[3]);
      }
      else if ((results[0].status == "ZERO_RESULTS") && which == "DRIVING") {
        if (drive.length == 0) {
          drive.push(theInfo[0]);
          drive.push(theInfo[1]);
        }
        ride = "TRANSIT: There are no public transit options for your chosen route.";
      }
      document.getElementById('resultSection').innerHTML = '<p>The Verdict</p>'
      document.getElementById('drivingInput').innerHTML = drive;
      document.getElementById('transitInput').innerHTML = ride;
      document.getElementById('drivingCost').innerHTML = "Annual driving cost estimated at $" + monetaryCost
      document.getElementById('homeInput').innerHTML = theInput[0] + "<br>" + theInput[1];
      document.getElementById('theButton').innerHTML = '<button onClick="window.location.reload()"; id="next-button"><a href="#begin">Start Over</a></button>'
      }

    });
  }

  //uncomment the following if map with routes and directions are wanted
  var theMap = google.maps;
  //get map that shows Los Angeles
  map = new theMap.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat:34.0522,lng:-118.2437},
    zoom: 10
  });

  App = {
    //set up how route lines and directions will be shown
    map: map,
    bounds            : new theMap.LatLngBounds(),
    directionsService : new theMap.DirectionsService(),
    directionsDisplay1: new theMap.DirectionsRenderer({
                          map             : map,
                          preserveViewport: true,
                          polylineOptions : {strokeColor:'red'},
                          markerOptions: {icon: 'red.png'},
                          // panel           : document.getElementById('panel').appendChild(document.createElement('li'))
                        }),
    directionsDisplay2: new theMap.DirectionsRenderer({
                          map             : map,
                          preserveViewport: true,
                          suppressMarkers : true,
                          polylineOptions : {strokeColor:'purple'},
                          // panel           : document.getElementById('panel').appendChild(document.createElement('li'))
                        }),
    directionsDisplay3: new theMap.DirectionsRenderer({
                          map             : map,
                          preserveViewport: true,
                          polylineOptions : {strokeColor:'green'},
                          markerOptions: {icon: 'red.png'},
                          // panel           : document.getElementById('panel').appendChild(document.createElement('li'))
                          }),
    directionsDisplay4: new theMap.DirectionsRenderer({
                          map             : map,
                          preserveViewport: true,
                          suppressMarkers : true,
                          polylineOptions : {strokeColor:'blue'},
                          // panel           : document.getElementById('panel').appendChild(document.createElement('li'))
                          })
  },

  driveOption  = {  origin  :  homeAddress,
                destination :  workAddress,
                travelMode  :  theMap.TravelMode.DRIVING},
  metroOption  = {  origin   :  homeAddress,
                destination :  workAddress,
                travelMode  :  theMap.TravelMode.TRANSIT},
  driveOption2  = {  origin  :  workAddress,
                destination :  homeAddress,
                travelMode  :  theMap.TravelMode.DRIVING},
  metroOption2  = {  origin   :  workAddress,
                destination :  homeAddress,
                travelMode  :  theMap.TravelMode.TRANSIT};

  //function to extract transit data from google map API JSON object and extract transit information
  function nonMetro(result) {
    // document.getElementById('routesSection').innerHTML = '<p id="instructions" style="font-weight:400; font-size=3rem">Here are your routes:</p>';
    if (!result.routes[0]) {
      document.getElementById('walkingInput').innerHTML = "&nbsp; &nbsp; &nbsp;  (And Google considers the distance too far to walk.)";
    }
    else {
      var stepLength = result.routes[0].legs[0].steps.length;
      for (i=0; i < stepLength; i++) {
        // calculate annual cost of taking transit using year average of 251 work days
        var travMode = JSON.stringify(result.routes[0].legs[0].steps[i].travel_mode);
        var fares = (1.75 * 502).toFixed(2);

        if (stepLength == 1 && travMode == '"WALKING"') {
          document.getElementById('walkingInput').innerHTML = "&nbsp; &nbsp; &nbsp; Walking directions provided.";
        }
        else {
          document.getElementById('transitCost').innerHTML = "Annual transit cost estimated at $" + fares;
        }
        if (travMode && travMode == '"TRANSIT"') {
          var carrier = JSON.stringify(result.routes[0].legs[0].steps[i].transit.line.agencies[0].name);
          if (carrier != '"Metro - Los Angeles"') {
            carrierName = carrier.slice(1, -1);
            carrierName = " " + carrierName;
            if (notMetro.indexOf(carrierName) === -1) {
              notMetro.push(carrierName);
            }
            if (notMetro.length == 1) {
              document.getElementById('transitFee').innerHTML = "*Because the transit route includes" + notMetro + ", which is outside the Los Angeles Metro system, extra cost will be incurred."
            }
            else { document.getElementById('transitCost').innerHTML = "Annual transit cost estimated at $" + fares;
              multiNotMetro = notMetro.join(" and");
              document.getElementById('transitFee').innerHTML = "*Because the transit route includes" + multiNotMetro + ", which are outside the Los Angeles Metro system, extra cost will be incurred."
            }
          }
        }
      }
    }
  }
  // display routes
  App.directionsService.route(driveOption, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      App.directionsDisplay1.setDirections(result);
      App.map.fitBounds(App.bounds.union(result.routes[0].bounds));
    }
  //get home and work latitude and longitude pairs if needed for use with another mapping or charting program
  latLongHome = JSON.stringify(result.routes[0].legs[0].start_location);
  latLongWork = JSON.stringify(result.routes[0].legs[0].end_location);
  });

  App.directionsService.route(driveOption2, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      App.directionsDisplay2.setDirections(result);
      App.map.fitBounds(App.bounds.union(result.routes[0].bounds));
    }
  });

  App.directionsService.route(metroOption, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      App.directionsDisplay3.setDirections(result);
      App.map.fitBounds(App.bounds.union(result.routes[0].bounds));
    }
  nonMetro(result);
  });

  App.directionsService.route(metroOption2, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      App.directionsDisplay4.setDirections(result);
      App.map.fitBounds(App.bounds.union(result.routes[0].bounds));
    }
  nonMetro(result);
  });

  modes('DRIVING', timeToWork)
  modes('TRANSIT', timeToWork)
  modes('DRIVING', timeToHome)
  modes('TRANSIT', timeToHome)
};
