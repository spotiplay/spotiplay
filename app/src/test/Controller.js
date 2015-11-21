(function(){
    'use strict';

    spoti
       .controller('TestController', [
          '$scope', 'Playlists', 'Toast', Controller ]);
  function Controller($scope, Playlists, Toast) {

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
          
      };

      $scope.playlists = function() {
          $scope.result = '';

          var p;
          
          Playlists.all().then(
              function () {
                  $scope.result = JSON.stringify(p);
              },
              function () {
                  
              },
              function notify(playlists){
                  if (p)
                      Array.prototype.push.apply(p.items, playlists.items);
                  else
                    p = playlists;
              }
          );
      };
      
      $scope.$watch('playlist', function (playlist_id) {
          if (playlist_id) {
              var res = playlist_id.match(/spotify:user:(\w+):playlist:(\w+)/);
              if (!res)
                alert('wrong playlist_id');
              else
                  getPlaylist(res[1], res[2]);
              
              $scope.playlist = '';
          }
      });

      function getPlaylist(owner_id, playlist_id) {
          var result;
          Playlists.details(owner_id, playlist_id, true).then(
              function resolved(){
                  $scope.result = JSON.stringify(result);
              }, function error(){
              },
              function notify(r){
                  console.log(r);

                  if (r.type == 'playlist') {
                      result = r.data;
                      result.tracks.next = null;
                  } else if (r.type == 'tracks') {
                      if (result.tracks.items != r.data.items)
                          Array.prototype.push.apply(result.tracks.items, r.data.items);
                  }
              });
      }

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