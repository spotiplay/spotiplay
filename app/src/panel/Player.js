(function(){
    'use strict';

    spoti.directive('player', function() {
            return {
                restrict: 'E',
                templateUrl: 'src/panel/player.html',
                controller: 'Player'
            };
        });

    spoti.controller('Player',
        ['$scope', '$on', '$window', '$q', 'Tabs', 'Toast', 'Music', 'Queue', Player]);
    function Player($scope, $on, $window, $q, Tabs, Toast, Music, Queue) {

        $scope.button_play = {};
        $scope.button_save = {};
        $scope.button_add = {};
        $scope.state = Tabs.state;

        var a = localStorage.getItem("open_web_automatically");
        if (a === 'false') a = false;
        else a = true;
        $scope.open_web_automatically = a;
        
        
        setTimeout(function() {
            Queue.restore_backup()
              .then(function(tracks_ids, add_to_the_end){
                enqueue_tracks(tracks_ids, add_to_the_end, true)
                    .then(when_uploaded);
              });
              
            function when_uploaded(url){
              Toast.backup_restored()
                .then(function(){
                  $window.open(url);
                });
            }
        }, 3600);
        
        $scope.play = function(button, add_to_the_end) {
            if (user_id == 'demo') return Toast.demo_mode();
            
          button.queueing = true;
          
          var tracks_ids = Music.filtered_list.map(function(item){
            return item.id;
          });

          enqueue_tracks(tracks_ids, add_to_the_end)
            .then(finish_queueing, finish_queueing);
          
          function finish_queueing(){ 
            button.queueing = false;
          }
        };

        function enqueue_tracks(tracks_ids, add_to_the_end, suppress_auto_open) {
          var deferred = $q.defer();

          Queue.add(tracks_ids, add_to_the_end).then(success, error);
          function success(playlist_id){
              $scope.web_url = 'https://open.spotify.com/user/'+user_id+'/playlist/'+playlist_id;
              $scope.spotify_uri = 'spotify:user:'+user_id+':playlist:'+playlist_id;
              if ($scope.open_web_automatically && !add_to_the_end && !suppress_auto_open)
                  $window.open($scope.web_url);
              deferred.resolve($scope.web_url);
          }
          function error(err) {
            if (err == 'SNAPSHOT_CHANGED')
              Toast.replace_queue().then(
                  function when_accepted(){
                      Queue.force_reset(tracks_ids).then(success);
                  }, function when_cancelled() {
                      Queue.clean_backup();
                      deferred.reject();
                  });
            else {
              console.error('queue error', err);
              Rollbar.error('queue error', err);
              Toast.something_wrong();
              deferred.reject();
            }
          }

          return deferred.promise;
        }

        $scope.$watch('open_web_automatically', function(){
            var a = $scope.open_web_automatically;
            if (a === true || a === false)
                localStorage.setItem("open_web_automatically", a);
        });

        $on('tab_changed', function(event, current_tab){
            if (current_tab.type != 'tracks') {
                $scope.web_url = false;
                $scope.spotify_uri = false;
            }
        });


    }

})();