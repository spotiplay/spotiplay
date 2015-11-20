(function(){
    'use strict';

    spoti.service('Music', ['$q', 'Playlists', 'Save', 'Load', 'Toast', 'Queue', '$emit', Service]);

    function Service($q, Playlists, Save, Load, Toast, Queue, $emit){

        var self = this;
        self.state = {
            is_reloading: false,
            tracks: 0
        };
        var exports = {
            state: self.state,
            reload: reload
        };

        var slow_toast_timer = 0;

        function reload(playlist) {
            var deferred = $q.defer();

            if (self.state.is_reloading) {
                deferred.resolve();
                return deferred.promise;
            }
            self.state.is_reloading = true;
            self.state.tracks = 0;

            slow_toast_timer = setTimeout(function(){
                Toast.show_slow_loading(self.state.tracks);
            }, 3000);

            //Math.floor(Date.now() / 1000);

            if (playlist)
                reload_one_playlist(playlist, deferred);
            else
                check_all_playlists(deferred);

            return deferred.promise;
        }

        function reload_one_playlist(pl, deferred) {
            // На случай, если не получится обновление сейчас,
            // чтобы потом при общем рефреше обновился
            Save.mark_playlist_as_loaded(pl.id)
                .then(function() {
                    reload_playlist(pl.owner_id, pl.id, true)
                        .then(load_finished.bind(null, deferred));
                });
        }

        function check_all_playlists(deferred) {
            Load.get_playlists_config().then(function(rows){
                self.snapshots = [];
                self.loaded_playlists = [];
                rows.forEach(function(row){
                    self.snapshots.push(row.snapshot_id);
                    if (row.is_loaded) self.loaded_playlists.push(row.id)
                });
                save_updated_playlists(deferred);
            });
        }

        function load_finished(deferred) {
            Save.update_counters().then(function(){
                finish(deferred);
            });
        }

        function finish(deferred) {
            deferred.resolve();
            self.state.is_reloading = false;
            clearTimeout(slow_toast_timer);
            Toast.hide();
            $emit('list_refresh_request');
        }

        function save_updated_playlists(deferred) {
            var reloads = [];

            Playlists.all().then(
                function success() {
                    $q.all(reloads).then(load_finished.bind(null, deferred));
                },
                function error() {
                },
                function notify(playlists){
                    playlists.items.forEach(function (pl) {
                        if (we_have_this_snapshot(pl.snapshot_id)) return;
                        if (Queue.save_if_queue_playlist(pl)) return;
                        var force_save = this_is_already_loaded_playlist(pl.id);
                        var promise = reload_playlist(pl.owner.id, pl.id, force_save);
                        reloads.push(promise);
                    });
                }
            );
        }

        function this_is_already_loaded_playlist(playlist_id){
            if (self.loaded_playlists.indexOf(playlist_id) != -1) return true;
            // otherwise should be returned <undefined>,
            // so Playlists can take decision
        }

        function we_have_this_snapshot(snapshot_id) {
            var snap10 = snapshot_id.substr(0, 10);
            return self.snapshots.indexOf(snap10) != -1;
        }

        function reload_playlist(owner_id, playlist_id, force_save) {
            var deferred = $q.defer();

            Playlists.details(owner_id, playlist_id, force_save).then(
                function resolved(){
                    deferred.resolve();
                }, function error(){
                    deferred.resolve();
                },
                function notify(r){
                    if (r.type == 'playlist') {
                        Save.save_playlist(r.data, r.with_tracklist);
                    } else if (r.type == 'tracks') {
                        r.data.items.forEach(function (item, i) {
                            Save.save_all_about_track(playlist_id, item, r.data.offset+i);
                        });
                    }
                });
            return deferred.promise;
        }

        return exports;
    }


})();