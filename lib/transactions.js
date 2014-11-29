var util = require("./util");

var defaults = {
  powerLevelCostFactor: 1000,
  powerLevelCashInFactor: 750,
  multiplierCostFactor: 3,
  multiplierCashInFactor: 2,
  doubleOrNothingChanceFactor: 20,
  luckCostFactor: 1000,
  luckIncreaseFactor: 1,
  luckMaxIncrease: 40
};

module.exports = function(config) {
  config = config || {};
  util.merge(config, defaults);

  return {
    config: config,
    all: function() {
      var list = [
        {
          title: "Upgrade Power Level",
          socketEvent: "increase power level",
          socketHandler: "increasePowerLevel",
          description: "Spend " + config.powerLevelCostFactor + " Metapoints * Upgraded Power Level"
        },
        {
          title: "Cash-In Power Level",
          socketEvent: "cash-in power level",
          socketHandler: "cashInPowerLevel",
          description: "Gain " + config.powerLevelCashInFactor + " Metapoints * Current Power Level"
        },
        {
          title: "Increase Multiplier",
          socketEvent: "increase multiplier",
          socketHandler: "increaseMultiplier",
          description: "Spend " + config.multiplierCostFactor + " Power Levels * Current Multiplier"
        },
        {
          title: "Decrease Multiplier",
          socketEvent: "decrease multiplier",
          socketHandler: "decreaseMultiplier",
          description: "Gain " + config.multiplierCashInFactor + " Power Levels * Downgraded Multiplier"
        },
        {
          title: "Double or Nothing",
          socketEvent: "double or nothing",
          socketHandler: "doubleOrNothing",
          description: "Double Metapoints or Lose All Metapoints"
        },
        {
          title: "Increase Luck",
          socketEvent: "increase luck",
          socketHandler: "increaseLuck",
          description: "Spend " + config.luckCostFactor + " Metapoints * Current Luck"
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
      if(person.powerLevel > 0) {
        var gain = person.powerLevel * config.powerLevelCashInFactor;
        person.metapoints += gain;
        person.powerLevel--;
        callback(null, "Cashing in powerlevel: gained " + gain + " metapoints.");
      } else {
        callback("Not enough power levels.");
      }
    },
    increaseMultiplier: function(person, data, callback) {
      var cost = person.multiplier * config.multiplierCostFactor;
      if(person.powerLevel >= cost) {
        person.powerLevel -= cost;
        person.multiplier++;
        callback(null, "Increasing multiplier: " + person.multiplier);
      } else {
        callback(cost + " power levels required to increase multiplier.");
      }
    },
    decreaseMultiplier: function(person, data, callback) {
      if(person.multiplier > 1) {
        person.multiplier--;
        var gain = person.multiplier * config.multiplierCashInFactor;
        person.powerLevel += gain;
        callback(null, "Decreasing multiplier: gained " + gain + " power levels." );
      } else {
        callback("Not enough multipliers.");
      }
    },
    doubleOrNothing: function(person, data, callback) {
      var seed = Math.floor(Math.random() * 100);
      if(person.metapoints <= 0) {
        return callback("You don't have enough metapoints.");
      }
      if(seed < config.doubleOrNothingChanceFactor + Math.min(person.luck * config.luckIncreaseFactor, config.luckMaxIncrease)) {
        person.metapoints *= 2;
        callback(null, "Congratulations, you just doubled your metapoints!");
      } else {
        person.metapoints = 0;
        callback(null, "You lost all of your metapoints!");
      }
    },
    increaseLuck: function(person, data, callback) {
      var cost = person.luck * config.luckCostFactor;
      if(person.metapoints >= cost) {
        person.luck++;
        person.metapoints -= cost;
        callback(null, "Upgraded luck to " + person.luck + ".");
      } else {
        callback(cost + " metapoints required to increase luck.");
      }
    }
  };
};
