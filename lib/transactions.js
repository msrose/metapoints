var util = require("./util");

var defaults = {
  powerLevelCostFactor: 1000,
  powerLevelCashInFactor: 750,
  multiplierCost: 5,
  multiplierCashInValue: 4,
  doubleOrNothingChanceFactor: 2
};

module.exports = function(config) {
  config = config || {};
  util.merge(config, defaults);

  return {
    all: function() {
      var list = [
        {
          title: "Upgrade Power Level",
          socketEvent: "increase power level",
          socketHandler: "increasePowerLevel",
          type: "Spend",
          attribute: "Metapoints * upgraded Power Level",
          amount: config.powerLevelCostFactor
        },
        {
          title: "Cash-In Power Level",
          socketEvent: "cash-in power level",
          socketHandler: "cashInPowerLevel",
          type: "Gain",
          attribute: "Metapoints * current Power Level",
          amount: config.powerLevelCashInFactor
        },
        {
          title: "Increase Multiplier",
          socketEvent: "increase multiplier",
          socketHandler: "increaseMultiplier",
          type: "Spend",
          attribute: "Power Levels",
          amount: config.multiplierCost
        },
        {
          title: "Decrease Multiplier",
          socketEvent: "decrease multiplier",
          socketHandler: "decreaseMultiplier",
          type: "Gain",
          attribute: "Power Levels",
          amount: config.multiplierCashInValue
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
      return list;
    },
    increasePowerLevel: function(person, data, callback) {
      var cost = config.powerLevelCostFactor * (person.powerLevel + 1);
      if(person.metapoints >= cost) {
        person.powerLevel++;
        person.metapoints -= cost;
        callback(null, "Increasing power level to " + person.powerLevel);
      } else {
        callback(cost + " metapoints required to upgrade power level.");
      }
    },
    cashInPowerLevel: function(person, data, callback) {
      var gain = person.powerLevel * config.powerLevelCashInFactor;
      if(person.powerLevel > 0) {
        person.metapoints += gain;
        person.powerLevel--;
        callback(null, "Cashing in powerlevel: gained " + gain + " metapoints.");
      } else {
        callback("Not enough power levels.");
      }
    },
    increaseMultiplier: function(person, data, callback) {
      if(person.powerLevel >= config.multiplierCost) {
        person.powerLevel -= config.multiplierCost;
        person.multiplier++;
        callback(null, "Increasing multiplier: " + person.multiplier);
      } else {
        callback("Not enough power levels.");
      }
    },
    decreaseMultiplier: function(person, data, callback) {
      if(person.multiplier > 1) {
        person.multiplier -= 1;
        person.powerLevel += config.multiplierCashInValue;
        callback(null, "Decreasing multiplier: " + person.multiplier);
      } else {
        callback("Not enough multipliers.");
      }
    },
    doubleOrNothing: function(person, data, callback) {
      var seed = parseInt(Math.random() * 100);
      if(person.metapoints <= 0) {
        return callback("You don't have enough metapoints.");
      }
      if(seed % config.doubleOrNothingChanceFactor === 0) {
        person.metapoints *= 2;
        callback(null, "Congratulations, you just doubled your metapoints!");
      } else {
        person.metapoints = 0;
        callback(null, "You lost all of your metapoints!");
      }
    }
  };
};
