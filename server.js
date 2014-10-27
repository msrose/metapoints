var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var socket = require('socket.io');

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

  var io = socket(server);

  function findPersonBy(prop, val) {
    for(var i in cache.people) {
      if(cache.people[i][prop] === val) {
        return cache.people[i];
      }
    }
    return null;
  }

  function setActiveState(ip, active) {
    findPersonBy("ip", ip).active += active ? 1 : -1;
    io.emit("update", cache);
  }

  function changeMetapoints(name, type, requester) {
    var person = findPersonBy("name", name);

    if(person) {
      var desc;
      if(type === "inc") {
        person.metapoints++;
        desc = "increased";
      } else {
        person.metapoints--;
        desc = "decreased";
      }
      person.lastUpdatedBy = requester;
      io.emit("update", { people: cache.people, changed: { name: person.name, changer: requester, desc: desc }});
    } else {
      console.error("Person not found!", name);
    }
  }

  for(var i in cache.people) {
    cache.people[i].active = 0;
  }

  io.on("connection", function(socket) {
    var ip = socket.handshake.address;

    console.log("Socket connection established", ip);
    setActiveState(ip, true);

    socket.on("disconnect", function() {
      console.log("Socket disconnected", ip);
      setActiveState(ip, false);
    });

    socket.on("change metapoints", function(data) {
      console.log("Changing metapoints:", data);
      changeMetapoints(data.name, data.type, data.requester);
    });

    var me = findPersonBy("ip", ip);
    socket.emit("me data", me.name);
  });

  function serverHandler(req, res) {
    console.log("Request made: ", req.method, req.connection.remoteAddress, req.url);

    var ip = req.connection.remoteAddress;
    var requester = findPersonBy("ip", ip);

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
              for(var i in cache.people) {
                if(cache.people[i].name === body) {
                  res.writeHead(412, { "Content-Type": "text/plain" });
                  return res.end("Name " + body + " already taken");
                }
              }

              cache.people.push({ name: name, ip: ip, metapoints: 0 });
              io.emit("update", cache);
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
            res.writeHead(410, { "Content-Type": "text/plain" });
            res.end("HTTP no longer supported for changing metapoints");
          } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Unknown request");
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
