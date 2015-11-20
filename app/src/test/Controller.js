(function(){
    'use strict';

    spoti
       .controller('TestController', [
          '$scope', '$q', 'Toast', Controller ]);
  function Controller($scope, $q, Toast) {

      $scope.value = 0;




      function Test222(inp) {

          function run() {
              return inp*2;
          }

          return run();
      }

      var x = Test222(1);
      var y = Test222(2);
      log(x, y);


      $scope.test1 = function() {
          $scope.result = '';



          var q1 = new Query(function(data){
              return 'Conf:' + this.conf + ',data:' + data
          });
          q1.conf = '111';

          var q2 = new Query(function(data){
              return this.conf + data
          });
          q2.conf = '2';

          $scope.result += q1.result('a');
          $scope.result += ' | ';
          $scope.result += q2.result('b');

      };

      $scope.test2 = function() {
      };

      $scope.test3 = function() {
          Toast.something_wrong();
      };

      function Query(handler) {
          var self = this;
          self.result = handler;
      }

  }

})();