var powerLevelCostFactor = 1000;
var powerLevelCashInFactor = 750;
var multiplierCost = 3;
var multiplierCashInValue = 2;

var list = [
  {
    title: "Upgrade Power Level",
    socketEvent: "increase power level",
    socketHandler: "increasePowerLevel",
    type: "Spend",
    attribute: "Metapoints * upgraded Power Level",
    amount: powerLevelCostFactor
  },
  {
    title: "Cash-In Power Level",
    socketEvent: "cash-in power level",
    socketHandler: "cashInPowerLevel",
    type: "Gain",
    attribute: "Metapoints * current Power Level",
    amount: powerLevelCashInFactor
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
    attribute: "Power Levels",
    amount: multiplierCashInValue
  },
  {
    title: "Double or Nothing",
    socketEvent: "double or nothing",
    socketHandler: "doubleOrNothing",
    type: "Gain/Lose",
    attribute: "Metapoints",
    amount: "Double/All"
  }
];

exports.all = function() {
  return list;
};

exports.increasePowerLevel = function(person, data, callback) {
  if(person) {
    var cost = powerLevelCostFactor * (person.powerLevel + 1);
    if(person.metapoints >= cost) {
      person.powerLevel++;
      person.metapoints -= cost;
      callback(null, "Increasing power level to " + person.powerLevel);
    } else {
      callback(cost + " metapoints required to upgrade power level.");
    }
  }
};

exports.cashInPowerLevel = function(person, data, callback) {
  if(person) {
    var gain = person.powerLevel * powerLevelCashInFactor;
    if(person.powerLevel > 0) {
      person.metapoints += gain;
      person.powerLevel--;
      callback(null, "Cashing in powerlevel: gained " + gain + " metapoints.");
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
      person.powerLevel += multiplierCashInValue;
      callback(null, "Decreasing multiplier: " + person.multiplier);
    } else {
      callback("Not enough multipliers.");
    }
  }
};

exports.doubleOrNothing = function(person, data, callback) {
  if(person) {
    var seed = parseInt(Math.random() * 100);
    if(person.metapoints <= 0) {
      return callback("You don't have enough metapoints.");
    }
    if(seed % 2 === 0) {
      person.metapoints *= 2;
      callback(null, "Congratulations, you just doubled your metapoints!");
    } else {
      person.metapoints = 0;
      callback(null, "You lost all of your metapoints!");
    }
  }
}
