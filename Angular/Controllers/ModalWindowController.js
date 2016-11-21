//main controller
main.controller("ModalWindowController", ['$scope','$rootScope','$uibModalInstance', function ($scope, $rootScope, $uibModalInstance) {
    
  $scope.ok = function(){
      $uibModalInstance.close();
    };
}]);