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
    $scope.useMultiplier = false;
    $scope.cost = 0;

    socket.on("timeout change", function(data) {
      $scope.timeout = data.timeout;
      if(data.auth) $scope.authQuestion = data.auth;
    });

    socket.on("multiplier", function(data) {
      $scope.multiplier = data;
    });

    pointSizes.async().then(function(data) {
      $scope.pointSizes = data;
      $scope.selectedPointSize = pointSizes.defaultPointSize;
    });

    $scope.$watch("[selectedPointSize,useMultiplier,multiplier]", function() {
      var selectedPointValue;
      for(var i in $scope.pointSizes) {
        var currentSize = $scope.pointSizes[i];
        if(currentSize.name === $scope.selectedPointSize) {
          selectedPointValue = currentSize.value;
          break;
        }
      }
      $scope.cost = Math.round(selectedPointValue * ($scope.useMultiplier ? $scope.multiplier : 1) / 10);
    }, true);

    $scope.changeMetapoints = function(type) {
      if($scope.authAnswer) {
        socket.emit("change metapoints", {
          name: $scope.selectedName,
          type: type,
          size: $scope.selectedPointSize,
          authAnswer: $scope.authAnswer,
          useMultiplier: $scope.useMultiplier
        });
        $scope.authAnswer = "";
      }
    };
  }
]);
