angular.module("metapoints").controller("metapoints", ["$scope", "socket", "pointSizes", "identity",
  function($scope, socket, pointSizes, identity) {
    socket.on("update", function(data) {
      $scope.me = identity.name();
      $scope.pointsData = data.collection;
      $scope.selectedName = $scope.selectedName || identity.name();
      for(var i = 0; i < $scope.pointsData.length && $scope.selectedName === identity.name(); i++) {
        $scope.selectedName = $scope.pointsData[i].name;
      }
    });

    $scope.timeout = 0;
    $scope.authQuestion = "";

    socket.on("timeout change", function(data) {
      $scope.timeout = data.timeout;
      if(data.auth) $scope.authQuestion = data.auth;
    });

    $scope.selectedPointSize = pointSizes.defaultPointSize;
    pointSizes.async().then(function(data) {
      $scope.pointSizes = data;
    });

    $scope.changeMetapoints = function(inc) {
      socket.emit("change metapoints", {
        name: $scope.selectedName,
        type: inc ? "inc" : "dec",
        size: $scope.selectedPointSize,
        authAnswer: $scope.authAnswer
      });
      $scope.authAnswer = "";
    };
  }
]);
