var http = require('http');
var fs = require('fs');
var qs = require('querystring');

var pointsFile = process.argv[2];

if(!pointsFile) {
  console.error("No points file specified!");
} else {
  var cache = null;

  var pointsData = fs.readFileSync(pointsFile, "utf8");
  if(pointsData) {
    cache = JSON.parse(pointsData);
  } else {
    cache = {};
  }

  if(!cache.people) {
    cache.people = [];
  }

  var saveFreqInMins = parseInt(process.argv[3]) || 5;
  var ip = process.argv[4] || "localhost";
  var port = parseInt(process.argv[5]) || 1338;

  var server = http.createServer(serverHandler).listen(port, ip);

  function serverHandler(req, res) {
    console.log("Request made: ", req.method, req.connection.remoteAddress, req.url);

    var ip = req.connection.remoteAddress;
    var requester;
    for(var i in cache.people) {
      if(cache.people[i].ip === ip) {
        requester = cache.people[i];
        break;
      }
    }

    if(req.method === "GET") {
      var file = "";
      var contentType = "";
      var useCache = false;
      if(req.url === "/" || req.url === "/index.html") {
        if(!requester) {
          res.writeHead(302, { "Location": "/register.html" });
          res.end();
          return;
        } else {
          file = "index.html";
          contentType = "html";
        }
      } else if(req.url === "/register.html") {
        if(requester) {
          res.writeHead(302, { "Location": "/" });
          res.end();
          return;
        } else {
          file = "register.html";
          contentType = "html";
        }
      } else if(req.url === "/" + pointsFile) {
        contentType = "json";
        useCache = true;
      } else if(req.url === "/metapoints.js") {
        file = "metapoints.js";
        contentType = "javascript";
      } else if(req.url === "/styles.css") {
        file = "styles.css";
        contentType = "css";
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/" + contentType });
      if(useCache) {
        res.end(JSON.stringify(cache));
      } else {
        fs.readFile(file, "utf8", function(err, data) {
          if(err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error");
            return console.error(err);
          }
          res.end(data);
        });
      }
    } else if (req.method === "POST") {
      var body = "";

      req.on("data", function(data) {
        body += data.toString();
        if(body.length > 1e6) {
          res.writeHead(413, { "Content-Type": "text/plain" })
          res.end("Data too large!");
          return console.error("Too much data");
        }
      });

      req.on("end", function() {
        if(req.url === "/register") {
          if(!requester) {
            var name = qs.parse(body).name.split(" ").join("");
            if(!name) {
              res.writeHead(400, { "Content-Type": "text/plain" });
              res.end("Invalid name provided");
            } else {
              cache.people.push({ name: name, ip: ip, metapoints: 0 });
              res.writeHead(302, { "Content-Type": "text/plain", "Location": "/" });
              res.end("Registered " + body + " at " + ip);
            }
          } else {
            res.writeHead(412, { "Content-Type": "text/plain" });
            res.end("IP " + ip + " already registered");
          }
        } else {
          if(!requester) {
            res.writeHead(401, { "Content-Type": "text/plain" });
            res.end("IP not registered");
            return;
          }

          if(req.url === "/inc" || req.url === "/dec") {
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
              person.lastUpdatedBy = requester.name;
              res.writeHead(200, { "Content-Type": "text/plain" });
              res.end("Successfully updated " + person.name);
            } else {
              res.writeHead(404, { "Content-Type": "text/plain" });
              res.end("Unknown person " + body);
            }
          }
        }
      });
    }
  }

  console.log("Server running at " + ip + ":" + port);

  setInterval(function() {
    fs.writeFile(pointsFile, JSON.stringify(cache), function(err) {
      if(err) {
        console.error("Error saving data:", err);
      } else {
        console.log("Cached data saved to", pointsFile);
      }
    })
  }, saveFreqInMins * 60 * 1000);
}
