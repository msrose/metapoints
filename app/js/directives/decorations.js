angular.module("metapoints").directive("decorations", function() {
  return {
    restrict: "A",
    scope: {
      decorations: "=",
    },
    link: function(scope, element, attrs) {
      scope.$watch("decorations", function(decorations) {
        if(decorations) {
          element.css({
            borderColor: decorations.borderColor || "transparent",
            fontFamily: decorations.fontFamily || "inherit"
          });
        }
      });
    }
  }
});
