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

exports.sanitizeAuthInput = function(input) {
  return input.trim().toUpperCase().split(/[^\w]/).join("");
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
}

