var pointsAmounts = [
  { name: "xxlarge", value: 100 },
  { name: "xlarge", value: 50 },
  { name: "large", value: 25 },
  { name: "medium", value: 10 },
  { name: "small", value: 5 },
  { name: "default", value: 1 }
];

exports.getCurrentTime = function() {
  var d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function(x) {
    return x < 10 ? "0" + x : x
  }).join(":");
};

var excludedWords = ["THE", "A"];

exports.sanitizeAuthInput = function(input) {
  if(input === undefined || input === null) {
    return input;
  }
  return input.toString().trim().toUpperCase().split(/[^\w]/).filter(function(word) {
    return excludedWords.indexOf(word) === -1;
  }).join("");
};

exports.getPointsAmounts = function() {
  return pointsAmounts;
};

exports.getPointsAmount = function(size) {
  for(var i in pointsAmounts) {
    if(pointsAmounts[i].name === size) {
      return pointsAmounts[i].value;
    }
  }
  return 1;
};

exports.merge = function(object, defaults) {
  for(var prop in defaults) {
    if(object[prop] === undefined) {
      object[prop] = defaults[prop];
    }
  }
};
