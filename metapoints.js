var app = angular.module("metapoints", []);

app.controller("metapoints", ["$rootScope", "$scope", "$http", "$timeout", "$http",
  function($rootScope, $scope, $http, $timeout, $http) {
    var socket = io();

    socket.on("update", function(data) {
      $rootScope.$apply(function() {
        $scope.pointsData = data.people;
        if(!$scope.timeoutNotify && Notification && data.changed && data.changed.name === $scope.me && data.changed.changer !== data.changed.name) {
          var notification = new Notification("Metapoints updated", { body: data.changed.changer + " " + data.changed.desc });
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
        $scope.me = data.name;
        $scope.timedOut = data.timedOut;
      });
    });

    socket.on("timeout change", function(data) {
      $rootScope.$apply(function() {
        $scope.timedOut = data.timedOut;
        if($scope.timedOut) {
          $scope.remainingTimeout = data.duration / 1000;
          var decRemainingTimeout = function() {
            $scope.remainingTimeout--;
            if($scope.remainingTimeout > 0) {
              $timeout(decRemainingTimeout, 1000);
            }
          };
          $timeout(decRemainingTimeout, 1000);
        }
      });
    });

    $scope.selectedPointSize = "01-default";

    $http.get("/pointSizes").success(function(data, status, headers, config) {
      $scope.pointSizes = data;
    });

    $scope.enableNotifications = function() {
      if(Notification && !$scope.notificationsEnabled) {
        Notification.requestPermission(function() {
          $rootScope.$apply(function() {
            if(Notification.permission === "granted") {
              $scope.notificationsEnabled = true;
            }
          });
        });
      }
    };

    $scope.timeoutNotify = false;

    $scope.remainingTimeout = 0;

    $scope.notificationsEnabled = Notification ? Notification.permission === "granted" : false;

    $scope.inc = function(name) {
      socket.emit("change metapoints", {
        name: name,
        type: "inc",
        size: $scope.selectedPointSize
      });
    };

    $scope.dec = function(name) {
      socket.emit("change metapoints", {
        name: name,
        type: "dec",
        size: $scope.selectedPointSize
      });
    };
  }
]);
