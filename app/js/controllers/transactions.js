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

    socket.on("transaction list", function(data) {
      $scope.transactionList = data;
    });

    $scope.emitTransaction = function(name) {
      socket.emit(name);
    };
  }
]);
