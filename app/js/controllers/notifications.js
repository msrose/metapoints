angular.module("metapoints").controller("notifications", ["$rootScope", "$scope", "socket", "notification",
  function($rootScope, $scope, socket, notification) {
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

    socket.on("update", function(data) {
      socket.emit("request me data", null, function(me) {
        if(!notification.timedOut() && data.changed && data.changed.name === me.name) {
          notification.notify({
            title: "Metapoints updated",
            body: data.changed.changer + " " + data.changed.desc + " your metapoints by " + data.changed.amount,
            dismiss: 5000,
            timeout: 30000
          }, function(notification) {
            notification.onclick = function(e) {
              window.focus();
            };
          });
        }
      });
    });
  }
]);
