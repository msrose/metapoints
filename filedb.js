var fs = require('fs');

module.exports = function(saveFile, schema, callback) {
  callback = callback || function() {};
  var required = schema.required || [];
  var optional = schema.optional || {};
  var persist = schema.persist || required;

  var data;
  if(fs.existsSync(saveFile)) {
    data = fs.readFileSync(saveFile, "utf8");
    if(data) {
      data = JSON.parse(data);
      if(!data.collection) {
        return callback("Incorrect save file format.");
      }
      data = data.collection;
      data.forEach(function(item) {
        for(var prop in optional) {
          if(!item[prop]) {
            item[prop] = optional[prop];
          }
        }
        for(var i in required) {
          var prop = required[i];
          if(!item[prop]) {
            return callback("Save file " + saveFile + " contains entries with missing required property: " + prop);
          }
        }
      });
    }
  }

  if(!data) {
    data = [];
  }

  return {
    add: function(attrs, callback) {
      callback = callback || function() {};
      var newData = {};
      for(var prop in attrs) {
        newData[prop] = attrs[prop];
      }
      for(var i in required) {
        var prop = required[i];
        if(!newData[prop]) {
          return callback("Failed to add item. Missing required property: " + prop);
        }
      }
      for(var prop in optional) {
        if(!newData[prop]) {
          newData[prop] = optional[prop];
        }
      }
      data.push(newData);
      callback(null, "New item added to data");
    },
    findBy: function(prop, value) {
      for(var i in data) {
        if(data[i][prop] === value) {
          return data[i];
        }
      }
      return null;
    },
    save: function(callback) {
      callback = callback || function() {};
      var saveData = [];
      data.forEach(function(item) {
        var saveValues = {};
        for(var i in persist) {
          var prop = persist[i];
          saveValues[prop] = item[prop];
        }
        saveData.push(saveValues);
      });
      fs.writeFile(saveFile, JSON.stringify({ collection: saveData }), function(err) {
        if(err) {
          return callback(err);
        }
        callback(null, "Commit made to save file " + saveFile);
      });
    },
    all: function() {
      return { collection: data };
    }
  };
};
