(function(){
    'use strict';
    
spoti.controller('LogoutController',
    ['$scope', 'oauth', '$location', 'Save', Logout]);
function Logout($scope, oauth, $location, Save) {

    Save.wipe_db();
    oauth.wipe_tokens();
    user_id = false;
    localStorage.clear();

    $scope.alert = 'You signed out';

    $scope.loaded = true;
}

})();