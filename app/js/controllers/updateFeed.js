angular.module("metapoints").controller("updateFeed", ["$scope", "socket",
  function($scope, socket) {
    $scope.updateFeed = [];

    socket.on("update", function(data) {
      if(data.changed) {
        $scope.updateFeed.unshift(data.changed);
      }
      if($scope.updateFeed.length > 10) {
        $scope.updateFeed.pop();
      }
    });
  }
]);
