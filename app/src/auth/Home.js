(function(){
    'use strict';

    spoti.controller('HomeController',
        ['$scope', 'oauth', '$location', '$timeout', Home]);
    function Home($scope, oauth, $location, $timeout) {

        switch(oauth.check_arrival_of_access_token()) {
            case 'RESUME':
                $scope.loaded = true;
                break;
            case 'WRONG_STATE':
                $scope.loaded = true;
                $scope.alert = 'Can`t authenticate (wrong state)';
                break;
            case 'REDIRECT':
                break;
        }
    }


})();