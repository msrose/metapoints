angular.module("metapoints").controller("decorations", ["$scope", "socket",
  function($scope, socket) {
    socket.on("update", function(data) {
      socket.emit("request me data", null, function(me) {
        $scope.decorations = me.decorations;
      });
    });

    $scope.changeDecorations = function() {
      socket.emit("change decorations", $scope.decorations);
    };

    var showDecorationsKey = "metapoints.showDecorations";

    $scope.showDecorations = (function() {
      if(localStorage && localStorage[showDecorationsKey]) {
        return localStorage[showDecorationsKey] === "false" ? false : true;
      } else {
        return true;
      }
    })();

    $scope.toggleDecorations = function() {
      $scope.showDecorations = !$scope.showDecorations;
      if(localStorage) {
        localStorage[showDecorationsKey] = $scope.showDecorations;
      }
    };
  }
]);
