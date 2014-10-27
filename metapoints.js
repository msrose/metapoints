var app = angular.module("metapoints", []);

app.controller("metapoints", ["$rootScope", "$scope", "$http", "$timeout",
  function($rootScope, $scope, $http, $timeout) {
    var socket = io();

    socket.on("update", function(data) {
      $rootScope.$apply(function() {
        $scope.pointsData = data.people;
        if(!$scope.timeoutNotify && Notification && data.changed && data.changed.name === $scope.me && data.changed.changer !== data.changed.name) {
          var notification = new Notification("Metapoints updated", { body: data.changed.changer + " " + data.changed.desc + " your metapoints." });
          notification.onclick = function(e) {
            window.focus();
          };

          $timeout(function() {
            notification.close();
          }, 15000);

          $scope.timeoutNotify = true;
          $timeout(function() {
            $scope.timeoutNotify = false;
          }, 30000);
        }
      });
    });

    socket.on("me data", function(data) {
      $rootScope.$apply(function() {
        $scope.me = data;
      });
    });

    $scope.enableNotifications = function() {
      if(Notification && !$scope.notificationsEnabled) {
        Notification.requestPermission();
        if(Notification.permission === "granted") {
          $scope.notificationsEnabled = true;
        }
      }
    };

    $scope.timeoutNotify = false;

    $scope.notificationsEnabled = Notification ? Notification.permission === "granted" : false;

    $scope.inc = function(name) {
      $http.post("/inc", name);
    };

    $scope.dec = function(name) {
      $http.post("/dec", name);
    };
  }
]);
