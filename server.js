var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var express = require('express');
var url = require('url');
var request = require('request');
var pg = require('pg');

const unixTimestampDivisor = 1000; // Used to convert time in miliseconds to a unix timestamp.
const unixTimestampSecondsInDay = 86399;
var app = express();

var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

const access_token = "272855367.b6f7db4.27aee70b486a4fd7b1b5546c1da0453d";
const db_url = "postgres://fuaympypihyvwa:GUKk5aDGLgvOkab9XmyVYimW52@ec2-54-235-90-96.compute-1.amazonaws.com:5432/d19ldptt355nm9";
pg.defaults.ssl = true;

app.use("/public", express.static(__dirname + '/public'));

pg.connect(process.env.DATABASE_URL || db_url, function(err, client){
  if (err) throw err;

  client.query("SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = 'collections');", function(err, result){
    if (err) throw err;

    if (!result.rows[0].exists){
      // Create the table.
      client.query("CREATE TABLE COLLECTIONS(ID SERIAL PRIMARY KEY NOT NULL, tag_time INT NOT NULL, hashtag TEXT NOT NULL, username TEXT NOT NULL, media_type TEXT NOT NULL, media_url TEXT NOT NULL, original_url TEXT NOT NULL);");
    }
  });
});

app.get('/', function(request, response){
  response.sendFile('public/index.html', {root: __dirname });
});

// Create a collection in the database.
app.post('/createCollection', function(request, response){

  // Remove leading '#' if one exists.
  var hashtag = request.body.hashtag.charAt(0) === '#' ? request.body.hashtag.substring(1) : request.body.hashtag;
  var startDateUnixTimestamp = convertToUnixTimestamp(request.body.startDate);
  var endDateUnixTimestamp = convertToUnixTimestamp(request.body.endDate) + unixTimestampSecondsInDay; // Set to end of day instead of beginning.
 
  var options = {
    "count": 33,
    "callback": parseMediaForClosestEndDate,
    "endDate": endDateUnixTimestamp,
    "startDate": startDateUnixTimestamp
  };

  queryInstagram(hashtag, options, response);
});

// Get a collection of photos if one exists. 
app.get('/queryCollection', function(request, response){
  var url_parts = url.parse(request.url, true);
  var query = url_parts.query;
  // Remove leading '#' if one exists.
  var hashtag = query.hashtag.charAt(0) === '#' ? query.hashtag.substring(1) : query.hashtag;
  var startDateUnixTimestamp = convertToUnixTimestamp(query.startDate);
  var endDateUnixTimestamp = convertToUnixTimestamp(query.endDate) + unixTimestampSecondsInDay; // Set to end of day instead of beginning.

  queryDatabase(hashtag, startDateUnixTimestamp, endDateUnixTimestamp, response);
});

app.listen(process.env.PORT || 3000);

/*
* Functions
*/

function parseMediaForClosestEndDate(instagramData, endDate, startDate, hashtag, minTagId, parentResponse){
  var instagramResponse = JSON.parse(instagramData);
  var instagramMedia = instagramResponse.data;
  var index;
  var allPhotosWithinDateRange = true;
  
  var options = {
    "count": 33,
    "maxTagId": instagramResponse.pagination.next_max_id,
    "minTagId": minTagId,
    "callback": parseMediaForClosestEndDate,
    "endDate": endDate,
    "startDate": startDate
  };

  for (index = 0; index < instagramMedia.length; index ++){
    var currentMediaCreatedTime = instagramMedia[index].created_time;

    // Save the oldest media
    if (currentMediaCreatedTime > endDate){
      // If a photo is newer than the endDate, need to run the query again.
      allPhotosWithinDateRange = false;
      break;
    }
    if (currentMediaCreatedTime < startDate){
      options.minTagId = instagramResponse.pagination.min_tag_id;
      allPhotosWithinDateRange = false;
    }
  }

  if (!allPhotosWithinDateRange){ // If no media found yet, repeat the instagram query.
    queryInstagram(hashtag, options, parentResponse);
  } else {
    // Send data back to client and save collection in the db
    parentResponse.send(instagramData);
    saveCollectionInDB(instagramMedia, hashtag);
  }
}

function queryDatabase(hashtag, startDateUnixTimestamp, endDateUnixTimestamp, parentResponse){
  pg.connect(process.env.DATABASE_URL || db_url, function(err, client){
    if (err) throw err;
    var results = [];

    var query = client.query('SELECT * FROM COLLECTIONS WHERE tag_time BETWEEN $1 AND $2 AND hashtag = $3;', [startDateUnixTimestamp, endDateUnixTimestamp, hashtag], function(err, result){
      if (err) throw err;
    });

    query.on('row', function(row){
      results.push(row);
    });

    query.on('end', function(){
      parentResponse.send(results);
    })
  });
}

function saveCollectionInDB(instagramMedia, hashtag){
  var index;

  pg.connect(process.env.DATABASE_URL || db_url, function(err, client) {
    if (err) throw err;

    for (index = 0; index < instagramMedia.length; index++){
      var tag_time = instagramMedia[index].created_time;
      var media_type = instagramMedia[index].type;
      var media_url = media_type === "image" ? instagramMedia[index].images.standard_resolution.url : instagramMedia[index].videos.standard_resolution.url; 
      var original_url = instagramMedia[index].link;
      var username = instagramMedia[index].user.username;

      client.query("INSERT INTO COLLECTIONS(tag_time, hashtag, username, media_type, media_url, original_url) values($1, $2, $3, $4, $5, $6)", [tag_time, hashtag, username, media_type, media_url, original_url]);
    }
  });
}

function queryInstagram(hashtag, options, parentResponse){
  var url = "https://api.instagram.com/v1/tags/" + hashtag + "/media/recent?access_token=" + access_token;

  // Configure the URL to adhere to the optional paramaters. 
  if (options.count){
     url += "&count=" + options.count;
  }
  if (options.minTagId){
    url += "&min_tag_id=" + options.minTagId;
  }
  if (options.maxTagId){
    url += "&max_tag_id=" + options.maxTagId;
  }

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      
      switch(options.callback){
        case parseMediaForClosestEndDate:
          parseMediaForClosestEndDate(body, options.endDate, options.startDate, hashtag, options.minTagId, parentResponse);
          break;
      }
    }
  });
}

// Take a date in string format, and return a numerical value representing that date as a unix timestamp
function convertToUnixTimestamp(date){
  return new Date(date).getTime() / unixTimestampDivisor;
}

function convertToDate(unixTimestamp){
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(unixTimestamp*1000);
  return date.toUTCString();;
}
