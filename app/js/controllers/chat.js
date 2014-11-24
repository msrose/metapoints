angular.module("metapoints").controller("chat", ["$scope", "socket", "notification", "identity",
  function($scope, socket, notification, identity) {
    $scope.messages = [];
    $scope.savedChatLoaded = false;

    var msgDiv = document.getElementById("messageList");

    $scope.$watch("messages", function() {
      $scope.$evalAsync(function() {
        msgDiv.scrollTop = msgDiv.scrollHeight;
      });
    }, true);

    socket.on("saved chat", function(data) {
      if(!$scope.savedChatLoaded) {
        data.collection.forEach(function(message) {
          $scope.messages.push(message);
        });
        $scope.savedChatLoaded = true;
      }
    });

    function isTagged(name, sender, text) {
      return sender !== name && text.toUpperCase().indexOf("@" + name.toUpperCase()) >= 0;
    }

    socket.on("chat message", function(data) {
      $scope.messages.push(data);
      if(!notification.timedOut() && isTagged(identity.name(), data.sender, data.text)) {
        notification.notify({
          title: "Message from " + data.sender,
          body: data.text,
          dismiss: 5000,
          timeout: 15000
        }, function(notification) {
          notification.onclick = function(e) {
            window.focus();
          };
        });
      }
    });

    $scope.sendChatMessage = function() {
      socket.emit("send chat message", $scope.chatMessage);
      $scope.chatMessage = "";
    };
  }
]);
