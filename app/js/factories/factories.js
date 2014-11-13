var app = angular.module("metapoints");

app.factory("socket", ["$rootScope",
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

app.factory("pointSizes", ["$http",
  function($http) {
    return {
      async: function() {
        var promise = $http.get("/pointSizes").then(function(response) {
          return response.data;
        });

        return promise;
      },
      defaultPointSize: "default"
    };
  }
]);

app.factory("notification", ["$timeout",
  function($timeout) {
    var timedOut = false;

    return {
      notify: function(data, callback) {
        if(Notification) {
          var notification = new Notification(data.title, { body: data.body });
          callback(notification);

          if(data.dismiss) {
            $timeout(function() {
              notification.close();
            }, data.dismiss);
          }

          if(data.timeout) {
            timedOut = true;
            $timeout(function() {
              timedOut = false;
            }, data.timeout);
          }
        }
      },
      timedOut: function() {
        return timedOut;
      }
    };
  }
]);
