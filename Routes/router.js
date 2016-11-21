var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var builder = require('xmlbuilder'),
    extend  = require('extend'),
    https   = require('https'),
    moment  = require('moment'),
    path    = require('path'),
    url = require('url'),
	parseString = require('xml2js').parseString;
//Used for routes that must be authenticated.
// function isAuthenticated (req, res, next) {
//     // if user is authenticated in the session, call the next() to call the next request handler 
//     // Passport adds this method to request object. A middleware is allowed to add properties to
//     // request and response objects
//     //allow all get request methods
//     if(req.method === "GET"){
// 		console.log("unauthenticated");	
//         return next();
//     }
//     if (req.isAuthenticated()){
// 		console.log("authenticated");
//         return next();
//     }
//     console.log(req.user);
// 	 return next();
//     // if the user is not authenticated then redirect him to the login page
//     // return res.redirect('login');
// };

//Register the authentication middleware
//router.use('/', isAuthenticated);

router.get('/',function(req,res,next){	
	res.render('Starter',{title:"ManiMean"});	
});
//Below router is used to call the DHL tracking post function
router.get('/trackitem',function(req,res){
    //console.log(req.params.msg);
  /... code to do your work .../
//var url_parts = url.parse(req.url, true);
//var query = url_parts.query;
//var id = req.query.AWBNumber;

//Start
var self = this;
self.AWBNumber = req.query.AWBNumber;
self.outputdata = {};
  self.hosts = {
    staging: 'xmlpitest-ea.dhl.com',
    live: 'xmlpi-ea.dhl.com'
  };
  //The below path would be appended to the staging / live url
  //http://xmlpitest-ea.dhl.com/XMLShippingServlet
  self.path = 'XMLShippingServlet';
  //Make a json object to set the default values
  var defaults = {
    mode:          'staging',
    system:        'metric', // alternatively, 'imperial'
    userAgent:     'node-shipping-dhl',
    debug:         true,
    accountNumber: ''
  };
  //Required Parameters
  //var requiredParameters = ['siteId', 'password']

  function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
  }

  /**
   * Randomly generates "A string, peferably number, to uniquely identify
   * individual messages. Minimum length must be 28 and maximum length is 32".
   */
  function generateMessageReference () {
    var numberOfDigits, randomDigits, digit;
    numberOfDigits = randomInt(28, 33);
    randomDigits = [];

    for (var i = 0; i < numberOfDigits; i++) {
      digit = randomInt(0, 10);
      randomDigits.push(digit)
    }

    return randomDigits.join('');
  }

  /**
   * @param {String}   body data to send via POST to DHL
   * @param {Function} callback function to call on error or return
   *                   of data from DHL
   */
  //function postToDHL Start
  function postToDHL (body, callback) {
    
    var request = https.request({
      host: 'xmlpitest-ea.dhl.com',
      path: self.path,
      method: 'POST',
      headers: {
        'Content-Length': body.length,
        'Content-Type':   'text/xml'
      }
    });

    request.write(body);

    request.on('error', function (error) {
      callback(error, null);
      res.error();
    });

    request.on('response', function (response) {
      var responseData = '';
      self.output=response.toString();
      response.on('data', function (data) {
        responseData += data.toString();
		self.output = responseData;
      });

      response.on('end', function () {
        var json;
        try {
        		//Convert xml data to json object
				parseString(responseData, function (err, result) {
    				json = result;
				});
        	} catch (e) {
          if (self.options.debug) {
            console.log(e);
          }
          callback(new Error("unable to parse response into json"), null);
        }
		res.json(json);
      });
    });

    request.end();
  }
 //function postToDHL End

  var xmlDateFormat     = "YYYY-MM-DD",
      xmlDateTimeFormat = "YYYY-MM-DDThh:mm:ss";

  /**
   * @returns the authentication object to put at the top of the xml requests
   */
  function buildAuthenticationObject () {
    return {
      ServiceHeader: {
        MessageTime: moment().format(xmlDateTimeFormat),
          // TODO ??
          MessageReference: generateMessageReference(),
          SiteID:           'CIMGBTest',//self.options.siteId'',
          Password:         'DLUntOcJma'//self.options.password//,
          // PaymentType: 'T'
      }
    }
  }

  function concatKeyValuePair (xml, key, value) {
    var pair = {};
    pair[key] = value;
    return xml.concat(pair);
  }

function buildTrackXML (data){
	var xml =[];
	xml = concatKeyValuePair(xml, 'Request', buildAuthenticationObject());
	xml = concatKeyValuePair(xml, 'LanguageCode', 'en');
	xml = concatKeyValuePair(xml, 'AWBNumber', self.AWBNumber);
	xml = concatKeyValuePair(xml, 'LevelOfDetails', 'ALL_CHECK_POINTS');
    xml = concatKeyValuePair(xml, 'PiecesEnabled', 'S');
	return xml;
}

var track = function (data, callback) {
    if (!callback) {
      throw new Error("no callback specified");
    }

    if (!data) {
      throw new Error("no data provided");
    }

    var body = builder.create({
      'req:KnownTrackingRequest': {
        "@xmlns:req":          "http://www.dhl.com",
        "@xmlns:xsi":          "http://www.w3.org/2001/XMLSchema-instance",
        "@xsi:schemaLocation": "http://www.dhl.com TrackingRequestKnown.xsd"//,
        // "schemaVersion":      "1.0"
      }
    }).ele(buildTrackXML(data));

    // if (self.options.debug) {
    //   var pretty = body.end({pretty: true});
    //   console.log("Ship request XML:");
    //   console.log(pretty);
    // }
    var pretty = body.end({pretty: true});
    body = body.end();

    postToDHL(body, callback);
  }

  track(req, function(req,callback) {
    self.outputdata = req;
	//callback();
});
//callback(self.outputdata);
});
module.exports = router;