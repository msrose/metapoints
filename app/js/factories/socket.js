angular.module("metapoints").factory("socket", ["$rootScope",
  function($rootScope) {
    var socket = io();

    return {
      on: function(name, callback) {
        socket.on(name, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        });
      },
      emit: function(name, data, callback) {
        socket.emit(name, data, function() {
          if(callback) {
            var args = arguments;
            $rootScope.$apply(function() {
              callback.apply(socket, args);
            });
          }
        });
      }
    };
  }
]);
