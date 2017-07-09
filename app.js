// var moment = require('moment');

// set home and work addresses as global variables 
//this will not be hardcoded
var homeAddress = '3645 Westwood Blvd, Los Angeles, CA 90034';
var workAddress = '200 N Spring St, Los Angeles, CA 90012';

//setting global variables
var timeToWork;
var timeToHome;
var distanceAndTime;
var theTime;
var monetaryCost;
var totalTravelTime;
var annualDriveTime = [];
var annualTransitTime = [];
var latLongAddresses = [];
var timeTravelArray = [];
var transitTravelArray = [];
var times = [];
var homeLLAddress;
var workLLAddress;
// var toWorkAM;
// var toHomeAM;
var inAM;
var travelingAt = [];
// var userInput = [];

//function to use google maps API
function initMap() {

  //function to use geocoder to change street addresses to latitude and longitude
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
      
        // console.log("lat/lon home: " + homeLLAddress + "time to work: " + timeToWork);
        // console.log("lat/lon work: " + workLLAddress + "time home: " + timeToHome);
      }
    });
  }
  //call the function with the street addresses
  LLaddress(homeAddress);
  LLaddress(workAddress);

  //Set today as the date object
  var today = new Date();

  //change the date to next Wednesday
  function setTimes(hours, minutes, amOrPm) {
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

  //set up times to display as XX:XX AM or XX:XX PM
    Date.prototype.timesOnly = function() {
      var hours = this.getHours() %12 || 12;
      hours = hours.toString();
      var minutes = this.getMinutes().toString();
      return (hours[1]?hours:"0"+hours[0]%12) + ':' + (minutes[1]?minutes:"0"+minutes[0]);
    };
      
    var timeOfDay = nextWednesday.timesOnly()
    //determine AM or PM
    if (amOrPm == true) {
      timeOfDay = timeOfDay + ' AM';
    }
    else {
      timeOfDay = timeOfDay + ' PM';
    }

    times.push(timeOfDay);

    if (times.length == 2) {
      console.log("Home: " + homeAddress + "    Work: " + workAddress);
      console.log("Leaving for work at: " + times[0]);
      console.log("Leaving for home at: " + times[1]);
    }
  }

  //this will not be hardcoded
  var hrs = 8;
  var mnts = 0;
  var am = true;
  setTimes(hrs, mnts, am);
  setTimes(17, 30, false);

  // use Google Maps API to calculate distances and travel times
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
      if (annualTransitTime.length == 2 || annualDriveTime.length == 2 && totalTravelTime != 'undefined') {
        // console.log(theAddresses + ":")
        console.log(theMode + ": " + distanceAndTime)
        console.log("         Yearly cost: $" + monetaryCost + ", Total commute: " + totalTravelTime);
      }
    });
  }
  modes('DRIVING', timeToWork)
  modes('TRANSIT', timeToWork)
  modes('DRIVING', timeToHome)
  modes('TRANSIT', timeToHome)
}

