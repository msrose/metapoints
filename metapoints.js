angular.module("metapoints", []);

angular.module("metapoints").controller("metapoints", ["$scope", "$timeout", "socket", "pointSizes", "notification",
  function($scope, $timeout, socket, pointSizes, notification) {
    socket.on("update", function(data) {
      $scope.pointsData = data.people;

      var maxPowerLevel = 0;
      for(var i in $scope.pointsData) {
        var level = $scope.pointsData[i].powerLevel;
        if(level > maxPowerLevel) {
          maxPowerLevel = level;
        }
      }

      for(var i in $scope.pointsData) {
        var person = $scope.pointsData[i];
        person.powerBarSize = parseInt(person.powerLevel / maxPowerLevel * 100);
      }

      if(!notification.timedOut() && data.changed && data.changed.name === $scope.me) {
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
    });

    $scope.timeout = 0;

    socket.on("timeout change", function(data) {
      $scope.timeout = data.timeout;
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
