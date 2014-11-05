module.exports = function(configFile, defaults) {
  var config = require("./" + configFile);

  for(var prop in defaults) {
    if(!config[prop]) {
      config[prop] = defaults[prop];
    }
  }

  return config;
};
