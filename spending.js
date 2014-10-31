angular.module("metapoints").controller("spending", ["$scope", "socket",
  function($scope, socket) {
    $scope.upgradePowerLevel = function() {
      socket.emit("increase power level");
    };
  }
]);
