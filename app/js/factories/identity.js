angular.module("metapoints").factory("identity", ["socket",
  function(socket) {
    var name = "";

    socket.on("me data", function(data) {
      name = data.name;
    });

    return {
      name: function() {
        return name;
      }
    };
  }
]);
