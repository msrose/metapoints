angular.module("metapoints", ["ngRoute"])
  .config(["$routeProvider", function($routeProvider) {
    $routeProvider
      .when("/table", {
        templateUrl: "pointsTable.html",
        controller: "pointsTable"
      })
      .when("/graph", {
        templateUrl: "graph.html",
        controller: "graphs"
      })
      .otherwise({
        redirectTo: "/table"
      });
    }
]);
