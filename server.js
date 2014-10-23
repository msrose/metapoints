var http = require('http');
var fs = require('fs');

var cache = null;

http.createServer(function (req, res) {
  console.log("Request made: ", req.method, req.connection.remoteAddress, req.url);

  if(!cache) {
    fs.readFile("points.json", "utf8", function(err, data) {
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
      if(!cache) {
      }
    } else if(req.url === "/points.json") {
      res.writeHead(200, {'Content-Type': 'text/json'});
      if(cache) {
        console.log("Returning from cache");
        res.end(JSON.stringify(cache));
      } else {
        console.log("Cache error!");
        req.connection.destroy();
      }
      return;
    }

    if(file !== "") {
      res.writeHead(200, {'Content-Type': 'text/' + file.split(".")[1]});
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
      });
      req.on("end", function() {
        var person;
        for(var i in cache.people) {
          if(cache.people[i].name === body) {
            person = cache.people[i];
            break;
          }
        }
        if(person) {
          if(req.url === "/inc") {
            person.metapoints++;
          } else {
            person.metapoints--;
          }
          res.end("Success");
        } else {
          res.end("Unknown person " + body);
        }
      });
    }
  }
}).listen(1338, '10.4.3.175');
// }).listen(1338, 'localhost');
console.log('Server running');

setInterval(function() {
  fs.writeFile("points.json", JSON.stringify(cache), function(err) {
    if(err) {
      console.log("Error saving data: ", err);
    } else {
      console.log("Data saved");
    }
  })
}, 300000);
