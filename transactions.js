angular.module("metapoints").controller("transactions", ["$scope", "socket",
  function($scope, socket) {
    var collapsedKey = "transactions.collapsed";

    $scope.collapsed = (function() {
      if(localStorage && localStorage[collapsedKey]) {
        return localStorage[collapsedKey] === "false" ? false : true;
      } else {
        return true;
      }
    })();

    $scope.toggleCollapsed = function() {
      $scope.collapsed = !$scope.collapsed;
      if(localStorage) {
        localStorage[collapsedKey] = $scope.collapsed;
      }
    };

    $scope.upgradePowerLevel = function() {
      socket.emit("increase power level");
    };

    $scope.cashInPowerLevel = function() {
      socket.emit("cash-in power level");
    };
  }
]);
