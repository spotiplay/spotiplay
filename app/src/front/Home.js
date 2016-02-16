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
        
        if (user_id) {
            $location.path('/panel');
            $scope.hideButtons = true;
            $scope.redirecting = true;
        }
        
        if (navigator.userAgent.search("Firefox") > -1) {
            $scope.alert = 'Unfortunately, firefox do not support WebSQL, which is used for local data storing. Please, use Chrome or Safari';
            $scope.hideButtons = true;
        }
        
        $scope.demo = function () {
            console.log('demo');
            localStorage.setItem('oauth_token', 'demo-token');
            oauth.set_user('demo');
            $location.path('/panel');
        }
        
    }


})();