var schemas = {
  people: {
    required: ["ip", "name"],
    optional: {
      metapoints: 500,
      powerLevel: 0,
      active: 0,
      authQuestion: null,
      timeout: 0,
      lastUpdatedBy: null,
      multiplier: 1
    },
    persist: ["ip", "name", "metapoints", "powerLevel", "lastUpdatedBy", "multiplier"]
  },
  messages: {
    required: ["sender", "text", "time"]
  }
};

function makeSchemaGetter(schema) {
  return function() {
    return schemas[schema];
  };
}

for(var schema in schemas) {
  exports[schema] = makeSchemaGetter(schema);
}
