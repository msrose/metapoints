angular.module("metapoints").controller("graphs", ["$scope", "socket",
  function($scope, socket) {
    socket.emit("request update");

    $scope.barProps = ["metapoints", "powerLevel", "multiplier", "luck"];

    socket.on("update", function(data) {
      $scope.pointsData = data.collection;

      var props = $scope.barProps;
      var maxValues = {};

      for(var j in props) {
        var prop = props[j];
        maxValues[prop] = $scope.pointsData[0][prop];
        for(var i = 1; i < $scope.pointsData.length; i++) {
          var person = $scope.pointsData[i];
          if(person[prop] > maxValues[prop]) {
            maxValues[prop] = person[prop];
          }
        }
      }

      for(var i in $scope.pointsData) {
        var person = $scope.pointsData[i];
        for(var j in props) {
          var prop = props[j];
          var barSize = Math.max(Math.round((person[prop] / maxValues[prop]) * 100), 0);
          person[prop + "BarSize"] = maxValues[prop] <= 0 ? 0 : barSize;
        }
      }
    });

    var barFiltersKey = "graphs.barFilters";

    $scope.barFilters = (function() {
      if(localStorage && localStorage[barFiltersKey]) {
        return localStorage[barFiltersKey].split(",");
      } else {
        return $scope.barProps.slice();
      }
    })();

    $scope.toggleBarFilter = function(filter) {
      var index = $scope.barFilters.indexOf(filter);
      if(index == -1) {
        $scope.barFilters.unshift(filter);
      } else if($scope.barFilters.length > 1){
        $scope.barFilters.splice(index, 1);
      }

      if(localStorage) {
        localStorage[barFiltersKey] = $scope.barFilters.join(",");
      }
    };
  }
]);
