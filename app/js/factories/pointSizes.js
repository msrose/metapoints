angular.module("metapoints").factory("pointSizes", ["$http",
  function($http) {
    return {
      async: function() {
        var promise = $http.get("/pointSizes").then(function(response) {
          return response.data;
        });

        return promise;
      },
      defaultPointSize: "default"
    };
  }
]);

