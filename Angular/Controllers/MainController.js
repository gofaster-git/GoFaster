//main controller
main.controller("MainController", ['$scope', '$http', '$rootScope','$uibModal', function ($scope, $http, $rootScope,modalWindow) {
    var $ctrl = this;
    var modalScope = $scope.$new();
    $scope.tableList =[];
    $scope.headers =[];
    $scope.isDisplay = false;
  $scope.callingTrack = function() {
    //Check whether the AWBNumber is entered or not
    if(isNaN($scope.awbNumber))
    {
        $rootScope.modalInstance = modalWindow.open({
        templateUrl: 'modalOk.html',
        controller: 'ModalWindowController',
        size: 'sm'
      });
    }
    else
    {
      $http.get('http://ec2-54-145-240-253.compute-1.amazonaws.com:3000/trackitem?AWBNumber='+ $scope.awbNumber)
      .success(function(data){
      //$scope.tableList = data["req:TrackingResponse"].AWBInfo;
      //Get the ShipmentEvent List
      $scope.tableList = data["req:TrackingResponse"].AWBInfo["0"].ShipmentInfo["0"].ShipmentEvent.reverse();
      $scope.headers = _.groupBy($scope.tableList, "Date");
      //Record the no of peices values
       $scope.noOfPeices = data["req:TrackingResponse"].AWBInfo["0"].ShipmentInfo["0"].Pieces["0"];
      });
    }  
  }
  $scope.formatDate = function(date){
      var dateOut = new Date(date);
      return dateOut;
    };
  $rootScope.reset = function()
    {
      $scope.tableList =[];
      $scope.headers =[];
      $scope.awbNumber="";
    }
    $scope.clickOnPeices = function(){
      //Change the style of the peices element
      if($scope.isDisplay)
      {
        $scope.isDisplay = false;
      }
      else
      {
        $scope.isDisplay = true;
      }
      
    }
}]);