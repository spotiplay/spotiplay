(function(){
    'use strict';


    spoti.service('Queue', ['$q', 'Playlists', Queue]);
    function Queue($q, Playlists) {

        var storage = new QueueStorage();

        this.add = function(tracks_ids, just_add) {
            return new Enqueuer(Playlists, $q, storage,
                            tracks_ids, just_add, false).run();
        };

        this.force_reset = function(tracks_ids) {
            return new Enqueuer(Playlists, $q, storage,
                            tracks_ids, false, true).run();
        };

        this.save_if_queue_playlist =  function (pl) {
            if ((pl.name == SPOTIPLAY_QUEUE_NAME && pl.owner.id == user_id)){

                var stored = storage.get_queue_meta();
                if (!stored || stored.id != pl.id) {
                    // Don't have anything saved for queue list
                    // or Saved id is outdated
                    // => overwrite
                    storage.save_queue_meta(pl);
                    storage.unflag_changed_queue();
                    return true;
                }

                // Otherwise means we already know about this queue playlist
                // and have own opinion about snapshot_id

                return true;
            }
        };

        this.restore_backup = function() {
          var deferred = $q.defer();

          var backup = storage.load_from_backup();
          if (backup)
            deferred.resolve(backup.tracks, backup.just_add);
          else
            deferred.reject();

          return deferred.promise;
        };
        this.clean_backup = storage.clean_backup;

    }

    function Enqueuer(Playlists, $q, storage,
                      tracks_ids, just_add, force_reset) {
        var self = this;

        this.run = function() {
            // first save list to database,
            // for case if will be required redirect for oAuth authentication
            // (cuz for now Implicit Grant used)
            storage.backup_queue(tracks_ids, just_add);

            return self.upload_queue_to_spotify();
        };

        this.upload_queue_to_spotify = function() {
            var deferred = $q.defer();

            ensure_playlist_for_queue()
                .then(function(playlist_id){
                    Playlists.add_tracks(playlist_id, tracks_ids, just_add)
                        .then(function(snapshot_id){
                            storage.save_queue_meta({id: playlist_id, snapshot_id: snapshot_id});
                            storage.clean_backup();
                            deferred.resolve(playlist_id);
                        });
                }, deferred.reject);

            return deferred.promise;
        };

        // ------- PRIVATE -------

        function ensure_playlist_for_queue() {
            var deferred = $q.defer();

            var queue_meta = storage.get_queue_meta();
            if (queue_meta) {

                if (!force_reset && !just_add && storage.is_queue_changed()) {
                    deferred.reject('SNAPSHOT_CHANGED');
                } else
                    Playlists.details_to_verify_playlist(user_id, queue_meta.id)
                        .then(verify);

            } else
                create_new_queue_playlist();

            function verify(data){

                if (data.name != SPOTIPLAY_QUEUE_NAME) {
                    // User renamed queue, it's no longer for queueing
                    create_new_queue_playlist();
                } else if (data.snapshot_id.substr(0, 10) == queue_meta.snapshot_id)
                    deferred.resolve(queue_meta.id);
                else {
                    if (just_add) {
                        // Since it is only adding to the end - ok, we will simply add there,
                        // though queue was changed externally - means we can't simply reset it in future
                        storage.flag_changed_queue();
                        deferred.resolve(queue_meta.id);
                    } else if (force_reset) {
                        storage.unflag_changed_queue();
                        deferred.resolve(queue_meta.id);
                    } else {
                        deferred.reject('SNAPSHOT_CHANGED');
                    }
                }
            }

            function create_new_queue_playlist() {
                Playlists.create_playlist(SPOTIPLAY_QUEUE_NAME,
                    function(data) {
                        storage.save_queue_meta(data);
                        storage.unflag_changed_queue();
                        deferred.resolve(data.id);
                    });
            }

            return deferred.promise;
        }

    }

    function QueueStorage() {

        this.get_queue_meta = function() {
            var q = localStorage.getItem('queue_playlist');
            if (q) return JSON.parse(q);
        };

        this.save_queue_meta = function(pl) {
            localStorage.setItem("queue_playlist",
                JSON.stringify({
                    id: pl.id,
                    snapshot_id: pl.snapshot_id.substr(0, 10)
                }));
        };

        this.is_queue_changed = function() {
            return localStorage.getItem("queue_playlist_is_changed");
        };
        this.flag_changed_queue = function() {
            localStorage.setItem("queue_playlist_is_changed", true);
        };
        this.unflag_changed_queue = function() {
            localStorage.removeItem("queue_playlist_is_changed");
        };

        this.backup_queue = function(tracks_ids, just_add) {
            localStorage.setItem("queue_backup",
                JSON.stringify({
                    tracks: tracks_ids,
                    just_add: just_add
                })
            );
        };

        this.load_from_backup = function() {
          var b = localStorage.getItem("queue_backup");
          if (b) return JSON.parse(b);
        };

        this.clean_backup = function() {
            localStorage.removeItem("queue_backup");
        };
    }


})();