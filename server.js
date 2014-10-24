var http = require('http');
var fs = require('fs');

var cache = null;

var pointsFile = process.argv[2];
var saveFreqInMins = parseInt(process.argv[3]) || 5;
var ip = process.argv[4] || "localhost";
var port = parseInt(process.argv[5]) || 1338;

http.createServer(function (req, res) {
  console.log("Request made: ", req.method, req.connection.remoteAddress, req.url);

  if(!cache) {
    fs.readFile(pointsFile, "utf8", function(err, data) {
      if(err) {
        req.connection.destroy();
        return console.error(err);
      }
      cache = JSON.parse(data);
    });
  }

  if(req.method === "GET") {
    var file = "";
    if(req.url === "/") {
      file = "index.html";
    } else if(req.url === "/" + pointsFile) {
      res.writeHead(200, {'Content-Type': 'text/json'});
      if(cache) {
        console.log("Returning from cache");
        res.end(JSON.stringify(cache));
      } else {
        res.end("Cache error!");
        req.connection.destroy();
      }
      return;
    } else if(req.url === "/metapoints.js") {
      file = "metapoints.js";
    }

    if(file !== "") {
      var ext = file.split(".")[1];
      var type = ext === "js" ? "javascript" : ext;
      res.writeHead(200, {'Content-Type': 'text/' + type});
      fs.readFile(file, "utf8", function(err, data) {
        if(err) {
          req.connection.destroy();
          return console.error(err);
        }
        res.end(data);
      });
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end("Not found");
    }
  } else if (req.method === "POST") {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    if(req.url === "/inc" || req.url === "/dec") {
      var body = "";
      req.on("data", function(data) {
        body += data.toString();
        if(body.length > 1e6) {
          req.connection.destroy();
        }
      });
      req.on("end", function() {
        var person;
        if(cache) {
          for(var i in cache.people) {
            if(cache.people[i].name === body) {
              person = cache.people[i];
              break;
            }
          }
        } else {
          res.end("Cache not ready!");
        }
        if(person) {
          if(req.url === "/inc") {
            person.metapoints++;
          } else {
            person.metapoints--;
          }
          person.lastUpdatedBy = req.connection.remoteAddress;
          res.end("Success");
        } else {
          res.end("Unknown person " + body);
        }
      });
    }
  }
}).listen(port, ip);
console.log('Server running');

setInterval(function() {
  fs.writeFile(pointsFile, JSON.stringify(cache), function(err) {
    if(err) {
      console.log("Error saving data: ", err);
    } else {
      console.log("Data saved");
    }
  })
}, saveFreqInMins * 60 * 1000);
