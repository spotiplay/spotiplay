(function(){
    'use strict';

    var module_list = angular.module('list')
    .directive('list', function() {
        return {
            restrict: 'E',
            templateUrl: 'src/panel/lists/wrap.html',
            controller: 'List'
        };
    });

    module_list.controller('List',
        ['$scope', '$on', 'Load', 'GlobalFilter', 'Tabs', 'Toast', 'Music',
            '$anchorScroll', '$filter', List]);
    function List($scope, $on, Load, GlobalFilter, Tabs, Toast, Music,
              $anchorScroll, $filter) {

        GlobalFilter.reload_list = reload_list;
        $scope.list_view = 'playlists';
        var full_list = [];

        $scope.selectTag = function(item) {
            if ($scope.data.type != 'playlists' || item.is_loaded == 'true') {
                GlobalFilter.set_tag($scope.data.type, item);
                Tabs.state.selectedIndex = 2;
            } else {
                Toast.show_not_loaded(item.name, item.total)
                    .then(function(){
                        Music.reload(item);
                    });
            }
        };
        
        $scope.selectTrack = function(item) {
          $scope.data.filter.the_only_track = {
            id: item.id
          };
          filter_list();
        };

        Tabs.mute_current_tab = function() {
            full_list = [];
            filter_list();
            Tabs.state.total = '...';
        };
        Tabs.load_tab = function(tab){
            $scope.data = tab;
            $scope.data.filter.the_only_track = false;
            reload_list();
        };

        $on('list_refresh_request', reload_list);

        function reload_list() {
            if (!($scope.data && $scope.data.type)) return;

            Tabs.state.reading_db = true;
            $scope.list_view = $scope.data.type;
            $anchorScroll();
            setTimeout(reload, 1000);

            function reload() {
                Load.get_list($scope.data.type).then(function(rows){
                    full_list = rows;
                    filter_list();
                    Tabs.state.reading_db = false;
                });
            }
        }
        
        $scope.$watch('data.filter.fields.name', filter_list);
        $scope.$watch('data.filter.reverse', filter_list);
        $scope.$watch('data.filter.arrange_by', filter_list);
        $scope.$watch('data.filter.the_only_track', filter_list);
        function filter_list() {
          if (!$scope.data || ! $scope.data.filter) return;
          var f,
            filter = $scope.data.filter;
          
          if (filter.the_only_track)
            f = $filter('filter')(full_list, filter.the_only_track);
          else {  
            f = $filter('filter')(full_list, filter.fields);
            f = $filter('orderBy')(f, filter.arrange_by, filter.reverse);
          }
          $scope.filtered_list = Music.filtered_list = f;
          Tabs.state.total = f.length;
        }
    }






    module_list.filter('timeFormat', function() {
        return function(sec_num) {
            var hours   = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var seconds = Math.round(sec_num - (hours * 3600) - (minutes * 60));

            if (hours   < 10) {hours   = "0"+hours;}
            if (minutes < 10) {minutes = "0"+minutes;}
            if (seconds < 10) {seconds = "0"+seconds;}
            var time = minutes+':'+seconds;
            if (hours>0) time = hours+':'+time;
            return time;
        };
    });

})();