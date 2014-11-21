angular.module("metapoints").controller("alert", ["$scope", "$timeout", "socket",
  function($scope, $timeout, socket) {
    $scope.alertMessage = null;
    $scope.alertClass = "info";

    var timeoutPromise = null;

    $scope.$watch("alertMessage", function() {
      if($scope.alertMessage) {
        if(timeoutPromise) {
          $timeout.cancel(timeoutPromise);
        }
        timeoutPromise = $timeout(function() {
          $scope.alertMessage = null;
          timeoutPromise = null;
        }, 5000);
      }
    });

    socket.on("alert message", function(data) {
      $scope.alertMessage = data.msg;
      $scope.alertClass = data.alertClass;
    });
  }
]);
