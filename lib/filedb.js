module.exports = function(saveData, schema, callback) {
  callback = callback || function() {};
  var required = schema.required || [];
  var optional = schema.optional || {};
  var persist = schema.persist || required;

  var data = saveData;
  if(data) {
    data = JSON.parse(data);
    if(!data.collection) {
      return callback("Incorrect save data format.");
    }
    data = data.collection;
    data.forEach(function(item) {
      for(var prop in optional) {
        if(item[prop] === undefined) {
          item[prop] = optional[prop];
        }
      }
      for(var i in required) {
        var prop = required[i];
        if(item[prop] === undefined) {
          return callback("Save data contains entries with missing required property: " + prop);
        }
      }
    });
    callback(null, "Loaded data.");
  } else {
    data = [];
    callback(null, "Blank data, initializing new collection.");
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
        if(newData[prop] === undefined) {
          return callback("Failed to add item. Missing required property: " + prop);
        }
      }
      for(var prop in optional) {
        if(newData[prop] === undefined) {
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
    getSaveData: function(callback) {
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
      return JSON.stringify({ collection: saveData });
    },
    all: function() {
      return data;
    },
    collection: function() {
      return { collection: data };
    },
    at: function(index, callback) {
      callback = callback || function() {};
      if(index < 0 || index >= data.length) {
        return callback("Index out of range.");
      }
      return data[index];
    },
    remove: function(element, callback) {
      callback = callback || function() {};
      var i = data.indexOf(element);
      if(i === -1) {
        return callback("Element not in collection.");
      }
      data.splice(i, 1);
    },
    count: function() {
      return data.length;
    }
  };
};
