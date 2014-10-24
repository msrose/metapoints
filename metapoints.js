angular.module("metapoints", [])
.controller("metapoints", ["$scope", "$http", "$interval", function($scope, $http, $interval) {
  var updatePoints = function() {
    $http.get("/points.json")
      .success(function(data, status, headers, config) {
        $scope.pointsData = data.people;
      });
  };

  updatePoints();
  $interval(updatePoints, 1000);

  $scope.inc = function(name) {
    $http.post("/inc", name);
  };

  $scope.dec = function(name) {
    $http.post("/dec", name);
  };
}]);
