var http = require("http");
var fs = require("fs");
var qs = require("querystring");

var socket = require("socket.io");
var request = require("request");
var truncate = require("truncate");

var db = require("./lib/filedb");
var util = require("./lib/util");
var transactionHandler = require("./lib/transactions");
var serverHandler = require("./lib/serverhandler");
var schemas = require("./schemas.json").schemas;

var defaults = {
  pointsFile: "./points.json",
  messagesFile: "./messages.json",
  saveFreqInMins: 1,
  pointChangeIntervalInSec: 10,
  amountTimeoutFactor: 0.05,
  incorrectAuthTimeoutInSec: 60,
  jackpot: 500,
  jackpotIntervalInMins: 10,
  changeCostFactor: 0.1,
  host: "localhost",
  port: 1338,
  authQuestionsFile: false,
  subscribers: [],
  integrations: {}
};

var config;
var production = false;
if(process.argv[2] !== "--prod") {
  var configFile = process.argv[2] || "./config.json";
  config = fs.existsSync(configFile) ? require(configFile) : {};
} else {
  production = true;
  config = JSON.parse(process.env.CONFIG);
  config.port = parseInt(process.env.PORT);
}

util.merge(config, defaults);

console.log("Config initialized:", config);

var transactions = transactionHandler(config.transactions || {});
console.log("Initialized transactions:", transactions.config);

var server;
if(!production) {
  server = http.createServer(buildServerHandler()).listen(config.port, config.host);
} else {
  server = http.createServer(buildServerHandler()).listen(config.port);
}

var io = socket(server);

var authQuestions = config.authQuestionsFile ? require(config.authQuestionsFile).questions : null;
if(authQuestions) {
  console.log("Loaded", authQuestions.length, "auth questions from", config.authQuestionsFile);
  authQuestions.forEach(function(question) {
    question.answer = util.sanitizeAuthInput(question.answer);
  });
}

var integrationsList = [];
for(var key in config.integrations) {
  integrationsList.push(config.integrations[key].name);
}

var people = db(config.pointsFile, schemas.people, function(err, info) {
  if(err) {
    return console.error("Failed to init people:", err);
  }
  console.log(info);
});

var messages = db(config.messagesFile, schemas.messages, function(err, info) {
  if(err) {
    return console.error("Failed to init messages:", err);
  }
  console.log(info);
});

function timeoutPerson(person, timeout, callbacks) {
  person.timeout = timeout;
  setAuthQuestion(person);
  if(callbacks.started) callbacks.started();
  var intervalId = setInterval(function() {
    person.timeout--;
    if(callbacks.changed) callbacks.changed();
    if(person.timeout === 0) {
      clearInterval(intervalId);
    }
  }, 1000);
}

function setAuthQuestion(person) {
  if(authQuestions) {
    person.authQuestion = Math.floor(Math.random() * authQuestions.length);
  }
}

function getAmount(size, multiplier, useMultiplier) {
  var amount = util.getPointsAmount(size);
  if(useMultiplier && multiplier > 1) {
    amount *= multiplier;
  }
  return amount;
}

function getCost(amount) {
  return Math.round(amount * config.changeCostFactor);
}

function changeMetapoints(data, requester, callback) {
  callback = callback || function() {};
  if(data.name !== requester.name) {
    var person = people.findBy("name", data.name);

    if(person) {
      var amount = getAmount(data.size, requester.multiplier, data.useMultiplier);
      var cost = getCost(amount);
      if(cost > 0 && requester.metapoints < cost) {
        return callback("Insufficient metapoints.");
      }
      console.log("Changing metapoints:", requester.name, "changes", data.name, data.type, data.size);
      requester.metapoints -= cost;
      person.metapoints += data.type === "inc" ? amount : -amount;
      person.lastUpdatedBy = requester.name;
      callback(null, amount);
    } else {
      callback("Person " + data.name + " not found!");
    }
  } else {
    callback(requester.name + " tried to change their own metapoints.");
  }
}

function getAlertMessage(type, text) {
  return { alertClass: type, msg: text };
}

function getChatMessage(sender, text) {
  var dateString = (new Date()).toDateString();
  return { sender: sender, text: text, time: dateString + " " + util.getCurrentTime() };
}

io.on("connection", function(socket) {
  var ip = socket.handshake.address;
  var me = people.findBy("ip", ip);

  console.log("Socket connection established", ip);

  if(!me) {
    return console.error("Unknown person at IP", ip);
  }

  var timeoutStartCallback = function() {
    var timeoutData = { timeout: me.timeout };
    if(authQuestions) {
      timeoutData.auth = authQuestions[me.authQuestion].text;
    }
    io.sockets.in(me.ip).emit("timeout change", timeoutData);
  };

  var timeoutChangeCallback = function() {
    io.sockets.in(me.ip).emit("timeout change", { timeout: me.timeout });
  };

  socket.join(me.ip);
  socket.emit("transaction list", transactions.all());
  if(integrationsList.length > 0) {
    socket.emit("chat message", getChatMessage("metapoints", "Active integrations: " + integrationsList.join(", ")));
  }
  socket.emit("saved chat", messages.collection());

  setAuthQuestion(me);
  timeoutStartCallback();
  me.active++;
  io.emit("update", people.collection());

  socket.on("disconnect", function() {
    console.log("Socket disconnected", ip);
    if(me) {
      me.active--;
      io.emit("update", people.collection());
    }
  });

  socket.on("request me data", function(data, ack) {
    ack(me);
  });

  socket.on("request update", function(data) {
    socket.emit("update", people.collection());
  });

  socket.on("change metapoints", function(data) {
    if(typeof(data) === "object" && me && me.timeout === 0) {
      if(!authQuestions || data.authAnswer && util.sanitizeAuthInput(data.authAnswer) === authQuestions[me.authQuestion].answer) {
        changeMetapoints(data, me, function(err, amount) {
          if(err) {
            return socket.emit("alert message", getAlertMessage("error", "Could not update metapoints: " + err));
          }
          io.emit("update", {
            collection: people.all(),
            changed: {
              time: util.getCurrentTime(),
              name: data.name,
              changer: me.name,
              desc: data.type === "inc" ? "increased" : "decreased",
              amount: amount,
              reason: ""
            }
          });
          timeoutPerson(me, config.pointChangeIntervalInSec + Math.round(amount * config.amountTimeoutFactor), {
            started: timeoutStartCallback,
            changed: timeoutChangeCallback
          });
        });
      } else if(authQuestions) {
        timeoutPerson(me, config.incorrectAuthTimeoutInSec, {
          started: timeoutStartCallback,
          changed: timeoutChangeCallback
        });
        console.log("Incorrect auth answer by", me.name + ":", data.authAnswer);
        socket.emit("alert message", getAlertMessage("error", "Incorrect auth answer."));
      }
    } else {
      socket.emit("alert message", getAlertMessage("error", "You are timed out."));
    }
  });

  socket.on("request cost", function(data, ack) {
    if(typeof(data) === "object") {
      ack(getCost(getAmount(data.size, data.multiplier, data.useMultiplier)));
    }
  });

  transactions.all().forEach(function(t) {
    socket.on(t.socketEvent, function(data) {
      if(me) {
        transactions[t.socketHandler](me, data, function(err, info, logInfo) {
          if(err) {
            return socket.emit("alert message", getAlertMessage("error", err));
          }
          console.log("Transaction for", me.name + ":", info, logInfo || "");
          io.emit("update", people.collection());
          socket.emit("alert message", getAlertMessage("info", info));
        });
      }
    });
  });

  socket.on("send chat message", function(message) {
    var sanitizedMsg = message ? truncate(message.trim(), 500) : null;
    if(me && sanitizedMsg) {
      console.log("Chat message received from", me.name);
      var messageObj = getChatMessage(me.name, sanitizedMsg);
      messages.add(messageObj, function(err) {
        if(err) {
          return console.err("Error saving message from", me.name);
        }
        if(messages.count() > 10) {
          var toRemove = messages.at(0);
          messages.remove(toRemove);
        }
      });
      io.emit("chat message", messageObj);
    }
  });

  socket.on("change decorations", function(data) {
    if(typeof(data) === "object" && me && me.decorations) {
      if("borderColor" in data) {
        me.decorations.borderColor = data.borderColor;
      }
      if("fontFamily" in data) {
        me.decorations.fontFamily = data.fontFamily;
      }
      io.emit("update", people.collection());
    }
  });
});

function buildServerHandler() {
  return serverHandler.getHandler("./app", function(req) {
    var ip = util.getClientIP(req);
    return people.findBy("ip", ip);
  }, {
    onRegister: function(req, res, body) {
      var ip = util.getClientIP(req);
      var name = qs.parse(body).name.split(/[^\w]/).join("").toLowerCase();

      if(!name) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Invalid name provided");
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
          io.emit("update", people.collection());
          res.writeHead(302, { "Content-Type": "text/plain", "Location": "/" });
          res.end("Registered " + body + " at " + ip);
        });
      }
    },
    onIntegrationPost: function(req, res, body) {
      var ip = util.getClientIP(req);
      var integration = config.integrations[req.headers.metakey];

      if(!integration) {
        console.log("Unknown integration metakey:", req.headers.metakey);
        res.writeHead(401, { "Content-Type": "text/plain" });
        return res.end("Invalid meta key");
      }
      console.log("Receiving request from integration:", integration.name);
      try {
        console.log("Integration data sent:", body);
        var info = JSON.parse(body);
        if(!info.ip || !info.reason) {
          throw "Bad format";
        }
        var person = people.findBy("ip", info.ip);
        if(!person) {
          throw "Unknown person";
        }
        person.metapoints += integration.amount;
        person.lastUpdatedBy = integration.name;
        io.emit("update", {
          collection: people.all(),
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
        return res.end("Updated " + person.name + "'s metapoints");
      } catch (err) {
        console.log("Integration request from", integration.name, "generated an error:", err);
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Invalid request: " + err);
      }
    }
  });
}

console.log("Server running at " + config.host + ":" + config.port);

setInterval(function() {
  if(config.jackpot && people.count() > 0) {
    var luckMap = {};
    var totalLuck = 0;
    people.all().forEach(function(person) {
      totalLuck += person.luck;
      if(person.active > 0) {
        totalLuck += Math.ceil(person.luck / 2);
      }
      luckMap[totalLuck] = person;
    });
    var randomIndex = Math.floor(Math.random() * totalLuck) + 1;

    var luckMapNames = [];
    for(var prop in luckMap) {
      luckMapNames.push(prop + ": " + luckMap[prop].name);
    }
    console.log("Generated luck map {", luckMapNames.join(", "), "} with random index", randomIndex);

    while(!(randomIndex in luckMap)) {
      randomIndex++;
    }

    var person = luckMap[randomIndex];
    person.metapoints += config.jackpot;
    person.lastUpdatedBy = "The Jackpot";
    io.emit("update", {
      collection: people.all(),
      changed: {
        time: util.getCurrentTime(),
        name: person.name,
        changer: "The Jackpot",
        desc: "increased",
        amount: config.jackpot,
        reason: "being the lucky winner"
      }
    });
    console.log("Jackpot increased", person.name + "'s metapoints by", config.jackpot);
  }
}, config.jackpotIntervalInMins * 60 * 1000);

var lastStandingsPost = "";

setInterval(function() {
  console.log(util.getCurrentTime(), "Preparing to save...");
  people.save(function(err) {
    if(err) {
      return console.error("Error saving data:", err);
    }
    console.log("People saved to", config.pointsFile);
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
    people.all().forEach(function(person) {
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
