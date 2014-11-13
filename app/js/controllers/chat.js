angular.module("metapoints").controller("chat", ["$scope", "socket", "notification",
  function($scope, socket, notification) {
    $scope.messages = [];

    socket.on("me data", function(data) {
      $scope.me = data.name;
    });

    socket.on("chat message", function(data) {
      $scope.messages.push(data);
      if(!notification.timedOut() && data.text.toUpperCase().indexOf("@" + $scope.me.toUpperCase()) >= 0 && data.sender !== $scope.me) {
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
