(function(){
    'use strict';

    spoti.controller('AuthController',
         ['$scope', 'oauth', '$location', Auth]);
    function Auth($scope, oauth, $location) {

        handle_request();

        function handle_request() {
            log($location.path());
            if ($location.path() == '/auth')
                authenticate();
        }


        function authenticate() {
            log('>auth');

            $scope.alert = 'Authentication...';

            oauth.get_token(function (token) {
                log('got token: '+token);
                if (token) get_user_id();
            });
        }


        function get_user_id() {
            oauth.ajax({
                url: 'https://api.spotify.com/v1/me', dataType: 'json',
                success: function(data){
                    log('got user');
                    oauth.set_user(data.id);

                    $scope.$apply(function() {
                        $location.path('/panel');
                    });
                }
            });
        }
    }

})();