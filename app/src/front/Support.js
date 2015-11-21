(function(){
    'use strict';

    spoti.controller('SupportController',
        ['$scope', '$location',Support]);
    function Support($scope, $location) {

            $('#content').show();
            $('#preloader').hide();

    }

})();