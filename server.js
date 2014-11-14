var http = require("http");
var fs = require("fs");
var qs = require("querystring");
var socket = require("socket.io");
var request = require("request");
var truncate = require("truncate");

var db = require("./lib/filedb");
var util = require("./lib/util");
var transactions = require("./lib/transactions");

var defaults = {
  pointsFile: "./points.json",
  messagesFile: "./messages.json",
  saveFreqInMins: 1,
  pointChangeIntervalInSec: 10,
  incorrectAuthTimeoutInSec: 60,
  host: "localhost",
  port: 1338,
  authQuestionsFile: false,
  subscribers: [],
  integrations: {}
};

var configFile = process.argv[2] || "./config.json";
var config = fs.existsSync(configFile) ? require(configFile) : {};
util.merge(config, defaults);

console.log("Config initialized:", config);

var authQuestions = config.authQuestionsFile ? require(config.authQuestionsFile).questions : null;
if(authQuestions) {
  authQuestions.forEach(function(question) {
    question.answer = util.sanitizeAuthInput(question.answer);
  });
}

var integrationsList = [];
for(var key in config.integrations) {
  integrationsList.push(config.integrations[key].name);
}

var people = db(config.pointsFile, {
  required: ["ip", "name"],
  optional: { metapoints: 0, powerLevel: 0, active: 0, authQuestion: null, timeout: 0, lastUpdatedBy: null },
  persist: ["ip", "name", "metapoints", "powerLevel", "lastUpdatedBy"]
}, function(err) {
  console.error("Failed to init filedb:", err);
});

var messages = db(config.messagesFile, {
  required: ["sender", "text", "time"]
});

var server = http.createServer(serverHandler).listen(config.port, config.host);

var io = socket(server);

function timeoutPerson(person, timeout, callbacks) {
  person.timeout = timeout;
  setAuthQuestion(person);
  if(callbacks.started) callbacks.started();
  setTimeout(function() {
    person.timeout = 0;
    if(callbacks.finished) callbacks.finished();
  }, timeout * 1000);
}

function setAuthQuestion(person) {
  if(authQuestions) {
    person.authQuestion = parseInt(Math.random() * authQuestions.length);
  }
}

function changeMetapoints(data, requester, callback) {
  callback = callback || function() {};
  if(data.name !== requester.name) {
    console.log("Changing metapoints:", requester.name, "changes", data.name, data.type, data.size);
    var person = people.findBy("name", data.name);

    var amount = util.getPointsAmount(data.size);

    if(person) {
      person.metapoints += data.type === "inc" ? amount : -amount;
      person.lastUpdatedBy = requester.name;
      callback(null, amount);
    } else {
      callback("Person " + data.name + " not found!")
    }
  } else {
    callback("Person tried to change their own metapoints: " + requester.name);
  }
}

io.on("connection", function(socket) {
  var ip = socket.handshake.address;
  var me = people.findBy("ip", ip);

  console.log("Socket connection established", ip);

  var timeoutCallback = function() {
    if(socket) {
      var timeoutData = { timeout: me.timeout };
      if(authQuestions) {
        timeoutData.auth = authQuestions[me.authQuestion].text;
      }
      socket.emit("timeout change", timeoutData);
    }
  };

  if(me) {
    socket.emit("me data", { name: me.name });
    socket.emit("transaction list", transactions.all());
    if(integrationsList.length > 0) {
      socket.emit("chat message", { sender: "metapoints", text: "Active integrations: " + integrationsList.join(", "), time: util.getCurrentTime() });
    }
    socket.emit("saved chat", messages.all());

    setAuthQuestion(me);
    timeoutCallback();
    me.active++;
    io.emit("update", people.all());
  }

  socket.on("disconnect", function() {
    console.log("Socket disconnected", ip);
    if(me) {
      me.active--;
      io.emit("update", people.all());
    }
  });

  socket.on("change metapoints", function(data) {
    if(me && me.timeout === 0) {
      if(!authQuestions || data.authAnswer && util.sanitizeAuthInput(data.authAnswer) === authQuestions[me.authQuestion].answer) {
        changeMetapoints(data, me, function(err, amount) {
          if(err) {
            return socket.emit("error message", { msg: "Could not update metapoints: " + err });
          }
          io.emit("update", {
            collection: people.all().collection,
            changed: {
              time: util.getCurrentTime(),
              name: data.name,
              changer: me.name,
              desc: data.type === "inc" ? "increased" : "decreased",
              amount: amount,
              reason: ""
            }
          });
        });
        timeoutPerson(me, config.pointChangeIntervalInSec, { started: timeoutCallback, finished: timeoutCallback });
      } else if(authQuestions) {
        timeoutPerson(me, config.incorrectAuthTimeoutInSec, { started: timeoutCallback, finished: timeoutCallback });
        console.log("Incorrect auth answer by", me.name + ":", data.authAnswer);
        socket.emit("error message", { msg: "Incorrect auth answer." });
      }
    } else {
      socket.emit("error message", { msg: "You are timed out." });
    }
  });

  transactions.all().forEach(function(t) {
    socket.on(t.socketEvent, function(data) {
      transactions[t.socketHandler](me, data, function(err, info) {
        if(err) {
          return socket.emit("error message", { msg: err });
        }
        console.log("Transaction for", me.name + ":", info);
        io.emit("update", people.all());
      });
    });
  });

  socket.on("send chat message", function(message) {
    var sanitizedMsg = message ? truncate(message.trim(), 500) : null;
    if(sanitizedMsg) {
      console.log("Chat message received from", me.name);
      var message = { sender: me.name, text: sanitizedMsg, time: util.getCurrentTime() };
      messages.add(message, function(err) {
        if(err) {
          return console.err("Error saving message from", me.name);
        }
        if(messages.count() > 10) {
          var toRemove = messages.at(0);
          messages.remove(toRemove);
        }
      });
      io.emit("chat message", message);
    }
  });
});

function serverHandler(req, res) {
  console.log("Request made: ", req.method, req.connection.remoteAddress, req.url);

  var ip = req.connection.remoteAddress;
  var requester = people.findBy("ip", ip);

  if(req.method === "GET") {
    var file = "";
    var contentType = "";
    if(req.url === "/" || req.url === "/index.html") {
      if(!requester) {
        res.writeHead(302, { "Location": "/register.html" });
        res.end();
        return;
      } else {
        file = "app/views/index.html";
        contentType = "html";
      }
    } else if(req.url === "/register.html") {
      if(requester) {
        res.writeHead(302, { "Location": "/" });
        res.end();
        return;
      } else {
        file = "app/views/register.html";
        contentType = "html";
      }
    } else if(/.+\.js$/.test(req.url)) {
      file = "app/js" + req.url;
      contentType = "javascript";
    } else if(req.url === "/styles.css") {
      file = "app/css/styles.css";
      contentType = "css";
    } else if(req.url === "/pointSizes") {
      res.writeHead(200, { "Content-Type": "text/json" });
      res.end(JSON.stringify(util.getPointsAmounts()));
      return;
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/" + contentType });
    fs.readFile(file, "utf8", function(err, data) {
      if(err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error");
        return console.error(err);
      }
      res.end(data);
    });
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
          var name = qs.parse(body).name.split(/[^\w]/).join("").toLowerCase();
          if(!name) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Invalid name provided");
          } else {
            if(people.findBy("name", name) !== null || name === "metapoints") {
              res.writeHead(412, { "Content-Type": "text/plain" });
              return res.end("Name " + body + " already taken");
            }

            people.add({ name: name, ip: ip }, function(err) {
              if(err) {
                console.error("Could not add person: ", err);
                res.writeHead(500, { "Content-Type": "text/plain" });
                return res.end("Could not register new person.");
              }
              io.emit("update", people.all());
              res.writeHead(302, { "Content-Type": "text/plain", "Location": "/" });
              res.end("Registered " + body + " at " + ip);
            });
          }
        } else {
          res.writeHead(412, { "Content-Type": "text/plain" });
          res.end("IP " + ip + " already registered");
        }
      } else if(req.url === "/integrations") {
        var integration = config.integrations[req.headers.metakey];
        if(!integration) {
          res.writeHead(401, { "Content-Type": "text/plain" });
          return res.end("Invalid meta key");
        }
        console.log("Receiving request from integration:", integration.name);
        try {
          // Expecting { name: "name", reason: "why are you giving metapoints?" }
          var info = JSON.parse(body);
          console.log("Integration sent:", info);
          if(!info.name || !info.reason) {
            throw "Bad format";
          }
          var person = people.findBy("name", info.name);
          if(!person) {
            throw "Unknown person";
          }
          person.metapoints += integration.amount;
          io.emit("update", {
            collection: people.all().collection,
            changed: {
              time: util.getCurrentTime(),
              name: person.name,
              changer: integration.name,
              desc: integration.amount > 0 ? "increased" : "decreased",
              amount: Math.abs(integration.amount),
              reason: info.reason.toString().trim()
            }
          });
          res.writeHead(200, { "Content-Type": "text/plain" });
          return res.end("Updated " + info.name + "'s metapoints");
        } catch (err) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("Invalid request: " + err);
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Unknown request");
      }
    });
  }
}

console.log("Server running at " + config.host + ":" + config.port);

var lastStandingsPost = "";

setInterval(function() {
  people.save(function(err) {
    if(err) {
      return console.error("Error saving data:", err);
    }
    console.log("Data saved to", config.pointsFile);
  });

  messages.save(function(err) {
    if(err) {
      return console.error("Error saving messages:", err);
    }
    console.log("Messages saved to", config.messagesFile);
  });

  if(config.subscribers.length > 0) {
    var text = "<http://" + config.host + ":" + config.port + "|Current standings>:\n";
    var infoList = [];
    people.all().collection.forEach(function(person) {
      infoList.push(person.name + ": " + person.metapoints);
    });
    text += infoList.join(", ");

    if(text !== lastStandingsPost) {
      config.subscribers.forEach(function(subscriber) {
        request.post(subscriber.postUrl, { json: { text: text } }, function(err, res) {
          if(err) {
            return console.error("Error posting to", subscriber.name);
          }
          console.log("Posting to", subscriber.name, res.statusCode);
          lastStandingsPost = text;
        });
      });
    } else {
      console.log("No changes since last post to subscribers.");
    }
  }
}, config.saveFreqInMins * 60 * 1000);
