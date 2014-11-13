angular.module("metapoints").controller("chat", ["$scope", "socket", "notification", "identity",
  function($scope, socket, notification, identity) {
    $scope.messages = [];

    socket.on("chat message", function(data) {
      $scope.messages.push(data);
      if(!notification.timedOut() && data.sender !== identity.name && data.text.toUpperCase().indexOf("@" + identity.name.toUpperCase()) >= 0) {
        notification.notify({
          title: "Message from " + data.sender,
          body: data.text,
          dismiss: 15000,
          timeout: 15000
        }, function(notification) {
          notification.onclick = function(e) {
            window.focus();
          };
        });
      }
      var messageList = document.getElementById("messagelist");
      messageList.scrollTop = messageList.scrollHeight;
    });

    $scope.sendChatMessage = function() {
      socket.emit("send chat message", $scope.chatMessage);
      $scope.chatMessage = "";
    };
  }
]);
