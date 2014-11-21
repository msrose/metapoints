angular.module("metapoints").controller("updateFeed", ["$scope", "socket",
  function($scope, socket) {
    $scope.updateFeed = [];
    $scope.feedLength = 5;

    socket.on("update", function(data) {
      if(data.changed) {
        $scope.updateFeed.unshift(data.changed);
      }
      if($scope.updateFeed.length > $scope.feedLength) {
        $scope.updateFeed.pop();
      }
    });
  }
]);
