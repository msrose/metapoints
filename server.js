var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var socket = require('socket.io');

var configFile = process.argv[2] || "config.json";
var config = JSON.parse(fs.readFileSync(configFile));

var pointsFile = config.pointsFile || "points.json";
var saveFreqInMins = config.saveFreqInMins || 5;
var ip = config.host || "localhost";
var port = config.port || 1338;
var authQuestions = JSON.parse(fs.readFileSync(config.authQuestionsFile || "authquestions.json")).questions;

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

function setActiveState(person, active) {
  if(person) {
    person.active += active ? 1 : -1;
    io.emit("update", cache);
  }
}

function getCurrentTime() {
  var d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function(x) {
    return x < 10 ? "0" + x : x
  }).join(":");
}

var pointsAmounts = [
  { name: "xxlarge", value: 100 },
  { name: "xlarge", value: 50 },
  { name: "large", value: 25 },
  { name: "medium", value: 10 },
  { name: "small", value: 5 },
  { name: "default", value: 1 }
];

function getPointsAmount(size) {
  for(var i in pointsAmounts) {
    if(pointsAmounts[i].name === size) {
      return pointsAmounts[i].value;
    }
  }
  return 1;
}

function changeMetapoints(name, type, requester, size) {
  if(name !== requester) {
    console.log("Changing metapoints:", requester, "changes", name, type, size);
    var person = findPersonBy("name", name);

    var amount = getPointsAmount(size);

    if(person) {
      var desc;
      if(type === "inc") {
        person.metapoints += amount;
        desc = "increased";
      } else {
        person.metapoints -= amount;
        desc = "decreased";
      }
      person.lastUpdatedBy = requester;
      io.emit("update", {
        people: cache.people,
        changed: {
          time: getCurrentTime(),
          name: person.name,
          changer: requester,
          desc: desc,
          amount: amount
        }
      });

    } else {
      console.error("Person not found!", name);
    }
  }
}

for(var i in cache.people) {
  cache.people[i].active = 0;
  cache.people[i].timeout = 0;
  if(!cache.people[i].powerLevel) {
    cache.people[i].powerLevel = 0;
  }
}

io.on("connection", function(socket) {
  var ip = socket.handshake.address;
  var me = findPersonBy("ip", ip);

  console.log("Socket connection established", ip);

  if(me) {
    socket.emit("me data", { name: me.name });
    me.authQuestion = parseInt(Math.random() * authQuestions.length);
    socket.emit("timeout change", { timeout: me.timeout, auth: authQuestions[me.authQuestion].text });
    setActiveState(me, true);
  }

  socket.on("disconnect", function() {
    console.log("Socket disconnected", ip);
    if(me) setActiveState(me, false);
  });

  socket.on("change metapoints", function(data) {
    if(me && me.timeout === 0 && data.authAnswer && data.authAnswer.trim().toUpperCase() === authQuestions[me.authQuestion].answer.toUpperCase()) {
      changeMetapoints(data.name, data.type, me.name, data.size);
      me.timeout = 10;
      me.authQuestion = parseInt(Math.random() * authQuestions.length);
      socket.emit("timeout change", { timeout: me.timeout, auth: authQuestions[me.authQuestion].text });
      setTimeout(function() {
        me.timeout = 0;
        if(socket) {
          socket.emit("timeout change", { timeout: me.timeout });
        }
      }, 10000);
    } else {
      socket.emit("error message", { msg: "Error updating metapoints." });
    }
  });

  socket.on("increase power level", function() {
    if(me) {
      if(me.metapoints >= 1000) {
        console.log("Increasing power level:", me.name);
        me.powerLevel++;
        me.metapoints -= 1000;
        io.emit("update", cache);
      } else {
        socket.emit("error message", { msg: "1000 metapoints required to upgrade power level." });
      }
    }
  });

  socket.on("cash-in power level", function() {
    if(me) {
      if(me.powerLevel > 0) {
        console.log("Cashing in metapoints: ", me.name);
        me.powerLevel--;
        me.metapoints += 750;
        io.emit("update", cache);
      } else {
        socket.emit("error message", { msg: "Not enough power levels." })
      }
    }
  });
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
    } else if(/.+\.js$/.test(req.url)) {
      file = req.url.split("/")[1];
      contentType = "javascript";
    } else if(req.url === "/styles.css") {
      file = "styles.css";
      contentType = "css";
    } else if(req.url === "/pointSizes") {
      res.writeHead(200, { "Content-Type": "text/json" });
      res.end(JSON.stringify(pointsAmounts));
      return;
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
              if(cache.people[i].name === name) {
                res.writeHead(412, { "Content-Type": "text/plain" });
                return res.end("Name " + body + " already taken");
              }
            }

            cache.people.push({ name: name, ip: ip, metapoints: 0, active: 0, powerLevel: 0 });
            io.emit("update", cache);
            res.writeHead(302, { "Content-Type": "text/plain", "Location": "/" });
            res.end("Registered " + body + " at " + ip);
          }
        } else {
          res.writeHead(412, { "Content-Type": "text/plain" });
          res.end("IP " + ip + " already registered");
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Unknown request");
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
