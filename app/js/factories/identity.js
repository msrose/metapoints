angular.module("metapoints").factory("identity", ["socket",
  function(socket) {
    var me = {};
    socket.on("me data", function(data) {
      me = data;
    });
    return me;
  }
]);
