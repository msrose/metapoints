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
    $scope.showShortcuts = false;

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

    $scope.shortcuts = [
      { keys: "Alt+Up", action: "Increase Metapoints" },
      { keys: "Alt+Down", action: "Decrease Metapoints" },
      { keys: "Alt+M", action: "Toggle Multiplier" },
      { keys: "Alt+Shift+?", action: "Toggle Shortcut List" }
    ];

    $scope.handleShortcut = function(e) {
      if(e.altKey) {
        switch(e.keyCode) {
          case 38: //up
            $scope.changeMetapoints('inc');
            break;
          case 40: //down
            $scope.changeMetapoints('dec');
            break;
          case 77: //m
            $scope.useMultiplier = !$scope.useMultiplier;
            break;
          case 191:
            if(e.shiftKey) $scope.showShortcuts = !$scope.showShortcuts;
            break;
        }
      }
    };

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
