
var latLongAddresses = [];
var travelingAt = [];
var annualDriveTime = [];
var annualTransitTime = [];
var latLongAddresses = [];
var timeTravelArray = [];
var transitTravelArray = [];
var times = [];
var travelingAt = [];
var userInput = [];
var theInput = [];
var theInfo = [];

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
  this.originPlaceId = null;
  this.destinationPlaceId = null;
  this.travelMode = 'DRIVING';
  //set up to get user data from form
  var originInput = document.getElementById('origin-input');
  var destinationInput = document.getElementById('destination-input');
  var leaveHome = document.getElementById('leave-home');
  var leaveWork = document.getElementById('leave-work');

  //get all user input
  function userInput (homeAddy,workAddy,departHome,departWork) {
    
    home = homeAddy;
    fromHome = departHome;
    work = workAddy;
    fromWork = departWork;
  }

  userInput (originInput, destinationInput, leaveHome, leaveWork);

  this.directionsService = new google.maps.DirectionsService;
  this.directionsDisplay = new google.maps.DirectionsRenderer;
  this.directionsDisplay.setMap(map);

  var originAutocomplete = new google.maps.places.Autocomplete(
      originInput, {placeIdOnly: true});
  var destinationAutocomplete = new google.maps.places.Autocomplete(
      destinationInput, {placeIdOnly: true});

  this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
  this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput);
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
      me.originPlaceId = place.place_id;
    } else {
      me.destinationPlaceId = place.place_id;
    }
    me.route();
  });
};

AutocompleteDirectionsHandler.prototype.route = function() {
  
  if (!this.originPlaceId || !this.destinationPlaceId) {
    return;
  }
  var me = this;

  this.directionsService.route({
    origin: {'placeId': this.originPlaceId},
    destination: {'placeId': this.destinationPlaceId},
    travelMode: this.travelMode
  }, function(response, status) {
    if (status === 'OK') {
      me.directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });

  homeAddress = home.value;
  workAddress = work.value;
  leaveHome = fromHome.value;
  leaveWork = fromWork.value;

  function LLaddress(address) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode( { 'address': address}, function(results, status) {

      if (status == google.maps.GeocoderStatus.OK) {
          var latitude = results[0].geometry.location.lat();
          var longitude = results[0].geometry.location.lng();
      }
      //push into array
      latLongAddresses.push(latitude);
      latLongAddresses.push(longitude);
      //if all four coordinates are in the array, create latitude and longitude key-object pairs for home and work addresses
      if (latLongAddresses.length == 4){
        homeLLAddress = "{lat:" + latLongAddresses[0] + ",lng:" + latLongAddresses[1] + "}";
        workLLAddress = "{lat:" + latLongAddresses[2] + ",lng:" + latLongAddresses[3] + "}";
      }
    });
  }
  //call the function with the street addresses
  LLaddress(homeAddress);
  LLaddress(workAddress);

  function setTimes(time) {
    hours = time.slice(0,2);
    minutes = time.slice(3,5);
    var nextWednesday = new Date();
    nextWednesday.setDate(nextWednesday.getDate() + (9-nextWednesday.getDay())%7+1);
    //Apply users departure time data
    nextWednesday.setHours(hours, minutes);
    travelingAt.push(nextWednesday);

    if (travelingAt.length == 2) {

      timeToWork = travelingAt[0];
      timeToHome = travelingAt[1];

        //change the date to the following Wednesday and the one after that to add then average- ??
      // timeToWork2 = new Date(nextWednesday.setDate(nextWednesday.getDate() + (16-nextWednesday.getDay())%7+1));
      // timeToWork3 = new Date(nextWednesday.setDate(nextWednesday.getDate() + (23-nextWednesday.getDay())%7+1));
    }
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

    if (times.length == 2) {
      var x = "<br> Home: " + homeAddress.slice(0, -15) + "&nbsp; &nbsp; &nbsp; Work: " + workAddress.slice(0, -15);
      theInput.push(x);
      console.log(x);
      var y = "<br>Leaving for work at: " + times[0] +  "&nbsp; &nbsp; Leaving for home at: " + times[1] + "<br>";
      theInput.push(y);
      console.log(y);
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
          
          for (var j = 0; j < results.length; j++) {
            var theAddresses = originList[i].slice(0, -15) + ' to ' + destinationList[j].slice(0, -15);
            if (theMode === "DRIVING") {
              var distanceResult = results[j].distance.text;
              //slice " mi" off the distance return value
              var trimDistance = distanceResult.slice(0, -3);
              var theDistance = results[j].duration_in_traffic.text;
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
              } 
              //Put costs in decimal format
              monetaryCost = Math.round(cost*Math.pow(10,2))/Math.pow(10,2).toFixed(2)
              //Put distance and times into one variable
              var distanceAndTime = results[j].distance.text + ' each way. Home to work in ' +  timeToWork + "; work to home in " + timeToHome;                
            }  

            else if (theMode === "TRANSIT") {
              var theDistance = results[j].duration.text
              //adjust travel time in traffic from seconds to minutes
              var oneWayTravel = (results[j].duration.value / 60).toFixed(0);
              //store adjusted 
              transitTravelArray.push(oneWayTravel);
              // calculate annual cost of taking transit using year average of 251 work days 
              monetaryCost = (1.75 * 502).toFixed(2);
              //calculate annual travel time for each way of commute
              var transitTimeOneWay = (Math.round(oneWayTravel*Math.pow(10,2))/Math.pow(10,2))
              var annualTransitOneWay = Number(transitTimeOneWay) * 251;
              var transitTimeOneWay = ((Number(results[j].duration.value) * 251) / 60).toFixed(0);
              //push commute times to a variable
              annualTransitTime.push(annualTransitOneWay);
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
            var distanceAndTime = results[j].distance.text + ' each way. Home to work in ' +  timeToWork + "; work to home in " + timeToHome;
            }
          }
        }
      }
      if ((totalTravelTime && totalTravelTime.length) && annualTransitTime.length == 2 || annualDriveTime.length == 2) {
        var a = ("<br>" + theMode + ": " + distanceAndTime);
        theInfo.push(a);
        console.log(a);
        var b = ("<br> &nbsp; &nbsp; &nbsp; Yearly cost: $" + monetaryCost + ", Total commute: " + totalTravelTime);
        theInfo.push(b);
        console.log(b);
        console.log("** + " + typeof transitTravelArray[1]);

      }
      document.getElementById('theInput').innerHTML = theInput;
      document.getElementById('theInfo').innerHTML = theInfo;

    });
  }
 
  modes('DRIVING', timeToWork)
  modes('TRANSIT', timeToWork)
  modes('DRIVING', timeToHome)
  modes('TRANSIT', timeToHome)

};


