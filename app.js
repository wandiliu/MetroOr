// var moment = require('moment');

// set home and work addresses as global variables 
//(they are doubled right now but tone set will go away)
var homeAddress = '3645 Westwood Blvd, Los Angeles, CA 90034';
var workAddress = '200 N Spring St, Los Angeles, CA 90012';
// var homeStreetAddress = '3670 Westwood Boulevard, Los Angeles, CA';
// var workStreetAddress = '1117 S Figueroa St, Los Angeles, CA';

//Leave at 8:00AM 
var timeToWork = new Date(1499698800000);

//Leave at 5:30PM
var timeToHome = new Date(1499733000000);
//setting global variables
var distanceAndTime;
var theTime;
var monetaryCost;
var totalTravelTime;
var annualDriveTime = [];
var annualTransitTime = [];
var latLongAddresses = [];
var timeTravelArray = [];
var transitTravelArray = [];
var homeLLAddress;
var workLLAddress;

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
      
        console.log("lat/lon home: " + homeLLAddress);
        console.log("lat/lon work: " + workLLAddress);
      }
    });
  }
  //call the function with the street addresses
  LLaddress(homeAddress);
  LLaddress(workAddress);

  //use Google Maps API to calculate distances and travel times
  function modes(theMode, time) {
    //straight from the docs
    var service = new google.maps.DistanceMatrixService;
    service.getDistanceMatrix({
      origins: [homeAddress],
      destinations: [workAddress],
      travelMode: theMode,
      transitOptions: {
        departureTime: time
      },
      drivingOptions: {
        departureTime: time,
        trafficModel: 'pessimistic'
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
        if (annualTransitTime.length == 2 || annualDriveTime.length == 2) {
          // console.log(theAddresses + ":")
          console.log(theMode + ": " + distanceAndTime)
          console.log(theMode + ": Yearly cost: $" + monetaryCost + ", Total commute: " + totalTravelTime);
        }
    });
  }
  modes('DRIVING', timeToWork)
  modes('TRANSIT', timeToWork)
  modes('DRIVING', timeToHome)
  modes('TRANSIT', timeToHome)
}

