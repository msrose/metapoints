angular.module("metapoints").controller("error", ["$scope", "$timeout", "socket",
  function($scope, $timeout, socket) {
    $scope.errorMsg = null;

    socket.on("error message", function(data) {
      $scope.errorMsg = data.msg;
      $timeout(function() {
        $scope.errorMsg = null;
      }, 5000);
    });
  }
]);
