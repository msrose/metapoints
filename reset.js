var schemas = require("./schemas.json").schemas;

var saveFile = process.argv[2] || "./points.json";

var people = require("./lib/filedb")(saveFile, schemas.people, function(err) {
  if(err) {
    console.error("Failed to init people:", err);
  }
});

people.all().forEach(function(person) {
  person.metapoints = 0;
  person.powerLevel = 0;
  person.lastUpdatedBy = "";
  person.multiplier = 1;
  console.log("Resetting", person.name, person.ip);
});

people.save(function(err) {
  if(err) {
    return console.error("Could not save!", err);
  }
  console.log("Reset people.");
});
