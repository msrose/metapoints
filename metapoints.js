var app = angular.module("metapoints", []);

app.controller("metapoints", ["$rootScope", "$scope", "$http",
  function($rootScope, $scope, $http) {
    var socket = io();

    socket.on("update", function(data) {
      $rootScope.$apply(function() {
        $scope.pointsData = data.people;
      });
    });

    $scope.inc = function(name) {
      $http.post("/inc", name);
    };

    $scope.dec = function(name) {
      $http.post("/dec", name);
    };
  }
]);
