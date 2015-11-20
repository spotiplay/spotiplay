(function(){

    var list = angular.module('list', []);

    list.directive('filter', function() {
        return {
            restrict: 'E',
            scope: {filter:'='},
            templateUrl: 'src/panel/filter.html',
            controller: 'FilterController'
        };
    });

    list.controller('FilterController',
        ['$scope', 'GlobalFilter', '$on', Controller]);
    function Controller($scope, GlobalFilter, $on) {
        $scope.tags = GlobalFilter.tags;
        $scope.tag_type_titles = {
            playlists: 'Playlist',
            artists: 'Artist',
            albums: 'Album'
        };
        $scope.show_clear_tags = false;

        $scope.ownership_options = {
            mine: true,
            followed: true
        };

        $scope.removeTag = GlobalFilter.remove_tag;

        $scope.clear_tags = function() {
            Object.keys($scope.tags).forEach(GlobalFilter.remove_tag);
        };

        $on('after_tags_affected', function(event, args) {
            $scope.show_clear_tags = has_values($scope.tags);
        });

        function has_values(obj) {
            return Object.keys(obj).some(function(key) {
                if (obj[key]) return true;
            });
        }

        $scope.$watch('filter.arrange_state', function(state){
            if ( typeof state === 'undefined') return;
            $scope.filter.arrange_by = state.field;
            $scope.filter.reverse = state.reverse;
        });


        $scope.$watch('ownership_options.mine', switch_ownership_options.bind('mine'));
        $scope.$watch('ownership_options.followed', switch_ownership_options.bind('followed'));
        function switch_ownership_options() {
            var old = GlobalFilter.ownership;

            if (!$scope.ownership_options.mine && !$scope.ownership_options.followed) {
                if (this == 'mine') $scope.ownership_options.followed = true;
                if (this == 'followed') $scope.ownership_options.mine = true;
            }

            if ($scope.ownership_options.mine != $scope.ownership_options.followed)
                GlobalFilter.ownership = $scope.ownership_options.mine;
            else
                GlobalFilter.ownership = null;

            if (old !== GlobalFilter.ownership && GlobalFilter.reload_list) GlobalFilter.reload_list();
        }


    }

    spoti.service('GlobalFilter', ['$emit', GlobalFilter]);
    function GlobalFilter($emit) {
        var self = this;
        this.tags = {};
        this.set_tag = function(key, value) {
          self.tags[key] = value;
          $emit('after_tags_affected');
        };
        this.remove_tag = function(key) {
            delete self.tags[key];
            $emit('after_tags_affected');
            $emit('list_refresh_request');
        };
    }
})();