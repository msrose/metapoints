var powerLevelCost = 1000;
var powerLevelCashInValue = 750;

var list = [
  {
    title: "Upgrade Power Level",
    socketEvent: "increase power level",
    socketHandler: "increasePowerLevel",
    type: "spend",
    amount: powerLevelCost
  },
  {
    title: "Cash-In Power Level",
    socketEvent: "cash-in power level",
    socketHandler: "cashInPowerLevel",
    type: "gain",
    amount: powerLevelCashInValue
  }
];

exports.all = function() {
  return list
};

exports.increasePowerLevel = function(person, data, callback) {
  if(person) {
    if(person.metapoints >= powerLevelCost) {
      person.powerLevel++;
      person.metapoints -= powerLevelCost;
      callback(null, "Increasing power level to " + person.powerLevel);
    } else {
      callback(powerLevelCost + " metapoints required to upgrade power level.");
    }
  }
};

exports.cashInPowerLevel = function(person, data, callback) {
  if(person) {
    if(person.powerLevel > 0) {
      person.powerLevel--;
      person.metapoints += powerLevelCashInValue;
      callback(null, "Cashing in powerlevel: " + person.powerLevel);
    } else {
      callback("Not enough power levels.");
    }
  }
};
