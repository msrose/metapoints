angular.module("metapoints").controller("chat", ["$scope", "socket",
  function($scope, socket) {
    $scope.messages = [];

    socket.on("chat message", function(data) {
      $scope.messages.push(data);
      var messageList = document.getElementById("messagelist");
      messageList.scrollTop = messageList.scrollHeight;
    });

    $scope.sendChatMessage = function() {
      socket.emit("send chat message", $scope.chatMessage);
      $scope.chatMessage = "";
    };
  }
]);
