var powerLevelCost = 1000;
var powerLevelCashInValue = 750;
var multiplierCost = 10;
var multiplierCashInValue = 5000;

var list = [
  {
    title: "Upgrade Power Level",
    socketEvent: "increase power level",
    socketHandler: "increasePowerLevel",
    type: "Spend",
    attribute: "Metapoints",
    amount: powerLevelCost
  },
  {
    title: "Cash-In Power Level",
    socketEvent: "cash-in power level",
    socketHandler: "cashInPowerLevel",
    type: "Gain",
    attribute: "Metapoints",
    amount: powerLevelCashInValue
  },
  {
    title: "Increase Multiplier",
    socketEvent: "increase multiplier",
    socketHandler: "increaseMultiplier",
    type: "Spend",
    attribute: "Power Levels",
    amount: multiplierCost
  },
  {
    title: "Decrease Multiplier",
    socketEvent: "decrease multiplier",
    socketHandler: "decreaseMultiplier",
    type: "Gain",
    attribute: "Metapoints",
    amount: multiplierCashInValue
  }
];

exports.all = function() {
  return list;
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

exports.increaseMultiplier = function(person, data, callback) {
  if(person) {
    if(person.powerLevel >= multiplierCost) {
      person.powerLevel -= multiplierCost;
      person.multiplier++;
      callback(null, "Increasing multiplier: " + person.multiplier);
    } else {
      callback("Not enough power levels.");
    }
  }
};

exports.decreaseMultiplier = function(person, data, callback) {
  if(person) {
    if(person.multiplier > 1) {
      person.multiplier -= 1;
      person.metapoints += multiplierCashInValue;
      callback(null, "Decreasing multiplier: " + person.multiplier);
    } else {
      callback("Not enough multipliers.");
    }
  }
};
