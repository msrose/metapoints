var schemas = require("./schemas.json").schemas;

var config = require(process.argv[2] || "./config.json");
var db = require("./lib/filedb");

var people = db(config.pointsFile, schemas.people, function(err) {
  if(err) {
    console.error("Failed to init people:", err);
    return process.exit(1);
  }
});

people.all().forEach(function(person) {
  person.metapoints = schemas.people.optional.metapoints;
  person.powerLevel = schemas.people.optional.powerLevel;
  person.lastUpdatedBy = schemas.people.optional.lastUpdatedBy;
  person.multiplier = schemas.people.optional.multiplier;
  person.luck = schemas.people.optional.luck;
  console.log("Resetting", person.name, person.ip);
});

people.save(function(err) {
  if(err) {
    console.error("Could not save!", err);
    return process.exit(1);
  }
  console.log("Reset people.");
});

var messages = db(config.messagesFile, schemas.messages, function(err) {
  if(err) {
    console.error("Could not load messages.");
    return process.exit(1);
  }
});

messages.all().forEach(function(message) {
  messages.remove(message);
});

messages.save(function(err) {
  if(err) {
    console.error("Could not save message!", err);
    return process.exit(1);
  }
  console.log("Reset messages.");
});