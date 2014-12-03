angular.module("metapoints").controller("pointsTable", ["$scope", "socket",
  function($scope, socket) {
    socket.emit("request update");

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
        if(person.powerLevel === 0 || maxPowerLevel === 0) {
          person.powerBarSize = 0;
        } else {
          person.powerBarSize = Math.max(parseInt(person.powerLevel / maxPowerLevel * 100), 1);
        }
      }
    });
  }
]);
