(function() {
    var a = angular.module('toast', ['ngMaterial']);

    a.controller('ToastCtrl',['$scope', '$mdToast', Controller]);
    function Controller($scope, $mdToast) {
        $scope.accept = function () {
            $mdToast.hide();
        };
        $scope.cancel = function () {
            $mdToast.cancel();
        };
    }

    a.service('Toast', ['$mdToast', '$rootScope', Service]);
    function Service($mdToast, $rootScope) {

        var self = this;
        var scope = {};
        var something_wrong_last_shown_at = 0;

        this.demo_mode = function() {
            show('demo-mode', false);
        };        
        this.show_slow_loading = function() {
            show('slow-loading', false);
        };
        this.show_not_loaded = function(playlist_name, tracks) {
            var promise = show('not-loaded', false, 'bottom left');
            scope.playlist_name = playlist_name;
            scope.tracks = tracks;
            return promise;
        };
        this.replace_queue = function() {
            return show('replace-queue', false, 'bottom left');
        };
        this.something_wrong = function(){
            // Prevent blinking of error's window on massive errors:
            if (something_wrong_last_shown_at + 30 * 1000 > Date.now())return;
            something_wrong_last_shown_at = Date.now();
            return show('something-wrong', 8000);
        };
        this.backup_restored = function() {
            return show('backup_restored', 12000, 'bottom left');
        };
        

        toast_something_wrong = this.something_wrong;

        function show(view, hideDelay, position) {
            scope = $rootScope.$new();
            return $mdToast.show({
                controller: 'ToastCtrl',
                templateUrl: '/src/toast/'+view+'.html',
                hideDelay: hideDelay,
                position: position ? position : 'right bottom',
                scope: scope
            });
        }

        this.hide = function() {
            $mdToast.hide();
        }
    }
})();
