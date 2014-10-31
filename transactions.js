angular.module("metapoints").controller("transactions", ["$scope", "socket",
  function($scope, socket) {
    $scope.upgradePowerLevel = function() {
      socket.emit("increase power level");
    };

    $scope.cashInPowerLevel = function() {
      socket.emit("cash-in power level");
    };
  }
]);
