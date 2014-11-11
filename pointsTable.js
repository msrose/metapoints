angular.module("metapoints").controller("pointsTable", ["$scope", "socket",
  function($scope, socket) {
    socket.on("update", function(data) {
      $scope.pointsData = data.collection;

      var maxPowerLevel = 0;
      for(var i in $scope.pointsData) {
        var level = $scope.pointsData[i].powerLevel;
        if(level > maxPowerLevel) {
          maxPowerLevel = level;
        }
      }

      for(var i in $scope.pointsData) {
        var person = $scope.pointsData[i];
        if(maxPowerLevel === 0) {
          person.powerBarSize = 0;
        } else {
          person.powerBarSize = parseInt(person.powerLevel / maxPowerLevel * 100);
        }
      }
    });
  }
]);
