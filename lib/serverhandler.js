var fs = require("fs");

var serveStatic = require("serve-static");
var finalhandler = require("finalhandler");

var util = require("./util");

exports.getHandler = function(rootPath, requesterFinder, finalHandlers) {
  var serve = serveStatic(rootPath + "/images");

  return function(req, res) {
    var ip = util.getClientIP(req);
    console.log("Request made:", req.method, ip, req.url);

    var requester = requesterFinder(req);

    if(req.method === "GET") {
      var file = "";
      var contentType = "";
      if(req.url === "/" || req.url === "/index.html") {
        if(!requester) {
          res.writeHead(302, { "Location": "/register.html" });
          return res.end();
        } else {
          file = "views/index.html";
          contentType = "html";
        }
      } else if(req.url === "/register.html") {
        if(requester) {
          res.writeHead(302, { "Location": "/" });
          return res.end();
        } else {
          file = "views/register.html";
          contentType = "html";
        }
      } else if(/.+\.html$/.test(req.url)) {
        file = "views" + req.url;
        contentType = "html";
      } else if(/.+\.js$/.test(req.url)) {
        file = "js" + req.url;
        contentType = "javascript";
      } else if(req.url === "/styles.css") {
        file = "css/styles.css";
        contentType = "css";
      } else if(/.+\.png$/.test(req.url.toLowerCase())) {
        var done = finalhandler(req, res);
        serve(req, res, done);
        return;
      } else if(req.url === "/pointSizes") {
        res.writeHead(200, { "Content-Type": "text/json" });
        return res.end(JSON.stringify(util.getPointsAmounts()));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not found");
      }

      res.writeHead(200, { "Content-Type": "text/" + contentType });
      fs.readFile(rootPath + "/" + file, "utf8", function(err, data) {
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
          console.error("Too much data");
          res.writeHead(413, { "Content-Type": "text/plain" });
          return res.end("Data too large!");
        }
      });

      req.on("end", function() {
        if(req.url === "/register") {
          if(!requester) {
            return finalHandlers.onRegister(req, res, body);
          } else {
            res.writeHead(412, { "Content-Type": "text/plain" });
            return res.end("IP " + ip + " already registered");
          }
        } else if(req.url === "/integrations") {
          return finalHandlers.onIntegrationPost(req, res, body);
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          return res.end("Unknown request");
        }
      });
    }
  };
};
