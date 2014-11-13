angular.module("metapoints").controller("metapoints", ["$scope", "socket", "pointSizes", "identity",
  function($scope, socket, pointSizes, identity) {
    $scope.me = identity.name;

    socket.on("update", function(data) {
      $scope.pointsData = data.collection;
      $scope.selectedName = $scope.selectedName || me.name;
      for(var i = 0; i < $scope.pointsData.length && $scope.selectedName === me.name; i++) {
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
