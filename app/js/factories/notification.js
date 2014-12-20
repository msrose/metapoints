angular.module("metapoints").factory("notification", ["$timeout",
  function($timeout) {
    var timedOut = false;

    return {
      notify: function(data, callback) {
        if(Notification) {
          var notification = new Notification(data.title, { body: data.body, icon: "metaicon.PNG" });
          callback(notification);

          if(data.dismiss) {
            $timeout(function() {
              notification.close();
            }, data.dismiss);
          }

          if(data.timeout) {
            timedOut = true;
            $timeout(function() {
              timedOut = false;
            }, data.timeout);
          }
        }
      },
      timedOut: function() {
        return timedOut;
      }
    };
  }
]);
