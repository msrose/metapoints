angular.module("metapoints", []);

angular.module("metapoints").controller("metapoints", ["$scope", "$timeout", "socket", "pointSizes", "notification",
  function($scope, $timeout, socket, pointSizes, notification) {
    $scope.getPowerArray = function(n) {
      var a = [];
      for(var i = n - 9; i <= n; i++) {
        if(i > 0) {
          a.push(i);
        }
      }
      return a;
    };

    socket.on("update", function(data) {
      $scope.pointsData = data.people;
      if(!notification.timedOut() && data.changed && data.changed.name === $scope.me && data.changed.changer !== data.changed.name) {
        notification.notify({
          title: "Metapoints updated",
          body: data.changed.changer + " " + data.changed.desc + " your metapoints by " + data.changed.amount,
          dismiss: 15000,
          timeout: 30000
        }, function(notification) {
            notification.onclick = function(e) {
              window.focus();
            };
        });
      }
    });

    socket.on("me data", function(data) {
      $scope.me = data.name;
      $scope.timedOut = data.timedOut;
    });

    $scope.remainingTimeout = 0;

    socket.on("timeout change", function(data) {
      $scope.timedOut = data.timedOut;
      if($scope.timedOut) {
        $scope.remainingTimeout = data.duration / 1000;
        var decRemainingTimeout = function() {
          $scope.remainingTimeout--;
          if($scope.remainingTimeout > 0) {
            $timeout(decRemainingTimeout, 1000);
          }
        };
        $timeout(decRemainingTimeout, 1000);
      }
    });

    $scope.selectedPointSize = pointSizes.defaultPointSize;
    pointSizes.async().then(function(data) {
      $scope.pointSizes = data;
    });

    $scope.changeMetapoints = function(name, inc) {
      socket.emit("change metapoints", {
        name: name,
        type: inc ? "inc" : "dec",
        size: $scope.selectedPointSize
      });
    };
  }
]);
