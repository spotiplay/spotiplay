(function(){
    'use strict';

    spoti.service('Playlists', ['$q', 'oauth', Service]);
    function Service($q, oauth){

        var exports = {
            all : all,
            details: details,
            details_to_verify_playlist: details_to_verify_playlist,
            create_playlist: create_playlist,
            add_tracks: add_tracks
        };

        // spits notify(playlists) - paginated playlists
        function all() {
            var url = user_id == 'demo' ?
                "/assets/demo-data/a-playlists.json" :
                "https://api.spotify.com/v1/users/"+user_id+"/playlists";
            
            return query(url,
                new Resolver(function(data){
                    this.deferred.notify(data);
                    if (data.next) {
                        send_ajax(data.next, this);
                    } else {
                        this.deferred.resolve();
                    }
                }));
        }

        function add_tracks(playlist_id, tracks_ids, to_the_end) {
            var deferred = $q.defer();

            // A maximum of 100 tracks can be added in one request.
            var packs = [], pack_index = 0;
            packs[pack_index] = [];
            tracks_ids.forEach(function(track_id) {
                if (packs[pack_index].length == 100) {
                    pack_index++;
                    packs[pack_index] = [];
                }
                packs[pack_index].push("spotify:track:"+track_id);
            });

            if (!to_the_end)
                oauth.ajax({
                    type: "PUT", // Reset playlist
                    url: "https://api.spotify.com/v1/users/"+user_id+"/playlists/"+playlist_id+"/tracks",
                    data: '{"uris":[]}',
                    success: upload
                });
            else
                upload();

            function upload() {
                send_custom_ajax("POST" ,
                    "https://api.spotify.com/v1/users/"+user_id+"/playlists/"+playlist_id+"/tracks",
                    {uris: packs.shift()}, success);
            }

            function success(data){
                if (packs.length > 0)
                    upload();
                else
                    deferred.resolve(data.snapshot_id);
            }

            return deferred.promise;
        }

        // first spits one notify({type: 'playlist', data: .. }), 
        // then many notify({type: 'tracks', data .. })
        function details(owner_id, playlist_id, with_tracklist) {
            var url = user_id == 'demo' ?
                "/assets/demo-data/"+playlist_id+".json" :
                "https://api.spotify.com/v1/users/"+owner_id+"/playlists/"+playlist_id+'?fields='+playlists_fields;
            return query(url,
                new Resolver(function(data){
                    var tracks;

                    // By default load track only for own playlists:
                    if (typeof with_tracklist == 'undefined')
                        with_tracklist = data.owner.id==user_id;

                    if (data.tracks) { // First fetch with playlist data
                        this.deferred.notify({
                            type: 'playlist',
                            with_tracklist: with_tracklist,
                            data: data
                        });
                        tracks = data.tracks;
                    } else
                        tracks = data;

                    if (with_tracklist) {
                        this.deferred.notify({type: 'tracks', data: tracks});
                        if (tracks.next) {
                            send_ajax(tracks.next + '&fields=' + tracks_fields, this);
                        } else {
                            this.deferred.resolve();
                        }
                    } else {
                        this.deferred.resolve();
                    }
                }));
        }

        function details_to_verify_playlist(owner_id, playlist_id) {
            return query("https://api.spotify.com/v1/users/"+owner_id+"/playlists/"+playlist_id+'?fields=snapshot_id,name');
        }

        function create_playlist(name, callback) {
            return send_custom_ajax("POST",
                "https://api.spotify.com/v1/users/"+user_id+"/playlists",
                {name: name}, callback);
        }

        function query(url, resolver) {
            if (!resolver)
                resolver = new Resolver(
                    function (data) {
                        this.deferred.resolve(data);
                    }
                );

            send_ajax(url, resolver);

            return resolver.promise();
        }

        function Resolver(parser) {
            var self = this;
            self.deferred = $q.defer();
            self.parse = parser;
            self.promise = function() {
                return self.deferred.promise;
            };
        }

        function send_ajax(url, resolver) {
            oauth.ajax({
                url: url, dataType: 'json',
                success: resolver.parse.bind(resolver)
            });
        }

        function send_custom_ajax(type, url, data, callback) {
            oauth.ajax({
                type: type,
                url: url, dataType: 'json', cache: false,
                data: JSON.stringify(data),
                success: callback
            });
        }

        // Promise-based API
        return exports;
    }


    var fields = [
        {'tracks': [
            'offset',
            'total',
            'next',
            {'items': [
                'added_at',
                'is_local',
                {'track': [ 'name', 'duration_ms', 'id', 'artists(id,name)', 'album(name,id)']}
            ]}
        ]},
        'id',
        'name',
        'images',
        'snapshot_id',
        'owner.id',
        'followers.total'
    ];
    var playlists_fields = dive(fields);
    var tracks_fields = dive(fields[0].tracks);

    function dive(o) {
        var output = '';
        o.forEach(function(i){
            if (output.length > 0) output += ',';
            if (typeof i == 'string')
                output += i;
            else {
                var key = Object.keys(i)[0];
                output +=  key + '(' + dive(i[key]) + ')';
            }
        });
        return output;
    }

})();
