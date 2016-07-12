var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var express = require('express');

var app = express();

app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(request, response){
  response.sendFile('public/index.html', {root: __dirname });
});

app.listen(process.env.PORT || 3000);

// function send404(response) {
//   response.writeHead(404, {"Content-type" : "text/plain"});
//   response.write("Error 404: resource not found");
//   response.end();
// }

// function sendPage(response, filePath, fileContents) {
//   response.writeHead(200, {"Content-type" : mime.lookup(path.basename(filePath))});
//   response.end(fileContents);
// }

// function serverWorking(response, absPath) {
//   fs.exists(absPath, function(exists) {
//     if (exists) {
//       fs.readFile(absPath, function(err, data) {
//         if (err) {
//           send404(response)
//         } else {
//           sendPage(response, absPath, data);
//         }
//       });
//     } else {
//       send404(response);
//     }
//   });
// }

// var server = http.createServer(function(request, response) {
//   var filePath = false;

//   if (request.url == '/') {
//     filePath = "public/index.html";
//   } else {
//     filePath = "public" + request.url;
//   }

//   var absPath = "./" + filePath;
//   serverWorking(response, absPath);
// });	

// var port_number = server.listen(process.env.PORT || 3000);



// var express = require('express');
// var app = express();

// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });

// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!');
// });