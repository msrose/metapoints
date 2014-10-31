angular.module("metapoints").factory("socket", ["$rootScope",
  function($rootScope) {
    var socket = io();

    return {
      on: function(name, callback) {
        socket.on(name, function(data) {
          $rootScope.$apply(function() {
            callback(data);
          });
        });
      },
      emit: function(name, data) {
        socket.emit(name, data);
      }
    };
  }
]);
