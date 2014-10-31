angular.module("metapoints").controller("notifications", ["$rootScope", "$scope",
  function($rootScope, $scope) {
    $scope.notificationsEnabled = Notification ? Notification.permission === "granted" : false;

    $scope.enableNotifications = function() {
      if(Notification && !$scope.notificationsEnabled) {
        Notification.requestPermission(function() {
          $rootScope.$apply(function() {
            if(Notification.permission === "granted") {
              $scope.notificationsEnabled = true;
            }
          });
        });
      }
    };
  }
]);
