(function() {
spoti.service('Save', ['$q','SpotiDB', Save]);
function Save($q, SpotiDB) {
    var self = this;
    var query = SpotiDB.query;

    this.save_all_about_track = function(playlist_id, item, index) {
        init_ids(item);
        item.track.artists.forEach(function(artist){
            save_artist(artist, item.track.id);
        });
        save_album(item.track.album, item.track.artists);
        save_track(item);
        track2playlist(item.track.id, playlist_id, index);
    };

    this.save_playlist = function(pl, with_tracklist) {
        var is_mine = pl.owner.id==user_id;
        var obj = {
            id: pl.id,
            name:pl.name,
            image: pl.images[0] ? pl.images[0].url : null,
            followers: pl.followers.total || 0,
            snapshot_id:pl.snapshot_id.substr(0, 10),
            owner_id: pl.owner.id,
            total:pl.tracks.total,
            is_mine: is_mine,
            is_loaded: with_tracklist
        };
        replace_into('playlists', obj);
        clean_tracks_links(pl.id);
    };

    this.mark_playlist_as_loaded = function(playlist_id) {
        return query('UPDATE playlists SET is_loaded=1, snapshot_id="reset" WHERE id=?;', [playlist_id]);
    };

    this.wipe_db = function() {
        query('DROP TABLE IF EXISTS playlists');
        query('DROP TABLE IF EXISTS tracks');
        query('DROP TABLE IF EXISTS artists');
        query('DROP TABLE IF EXISTS albums');
        query('DROP TABLE IF EXISTS artists_tracks');
        query('DROP TABLE IF EXISTS playlists_tracks');
    };

    this.update_counters = function() {
        return SpotiDB.queries(
            'UPDATE artists SET tracks=(SELECT COUNT(DISTINCT track_id) ' +
            '  FROM artists_tracks ' +
            '  WHERE artists_tracks.artist_id=artists.id) ' +
            'WHERE artists.tracks=-1;',

            'UPDATE albums SET tracks=(SELECT COUNT(DISTINCT tracks.id) ' +
            '  FROM tracks' +
            '  WHERE tracks.album_id=albums.id) ' +
            'WHERE albums.tracks=-1;');
    };

    // -- PRIVATE: -------------------------

    var hash = function(s){
        return CRC32.str(s.toLowerCase().trim()).toString();
    };

    function init_ids(item){
        var artists = '';
        item.track.artists.forEach(function(artist){
            artists += artist.name.trim();
            if(artist.id == null)
                artist.id = hash(artist.name);
        });

        if (item.track.id == null)
            item.track.id = hash(item.track.name + artists);

        if(item.track.album.id == null) item.track.album.id = hash(item.track.album.name);
    }

    function save_track(item) {
        var obj = {
          id: item.track.id, 
          album_id: item.track.album.id, 
          name: item.track.name, 
          is_local: item.is_local,
          duration: item.track.duration_ms / 1000,
          album: item.track.album.name,
          artists: item.track.artists.map(function(a){return a.name;}).join(', ')
        };

        replace_into('tracks', obj);
    }
    function track2playlist(track_id, playlist_id, index) {
        var obj = {};

        query('INSERT INTO playlists_tracks (playlist_id, track_id, idx) ' +
            'VALUES(?,?,?)',
            [playlist_id, track_id, index]);
    }
    function clean_tracks_links(playlist_id) {
        query('DELETE FROM playlists_tracks WHERE playlist_id=?;', playlist_id);
    }
    function save_artist(artist, track_id) {
        var obj = {
          id: artist.id,
          name: artist.name,
            tracks: -1
        };

        query('REPLACE INTO artists_tracks (artist_id, track_id)',
            [artist.id, track_id]);
        replace_into('artists', obj);
    }
    function save_album(album, artists) {
        var obj = {
          id: album.id, 
          name: album.name,
          artists: artists.map(function(a){return a.name;}).join(', '),
          tracks: -1
        };

        replace_into('albums', obj);
    }

    function replace_into(table, obj) {
        var keys = Object.keys(obj),
            vals = keys.map(function (key) {return obj[key];});
        query('REPLACE INTO '+table+' ('+keys.join(',')+') VALUES ('+getPlaceholdersFor(keys)+')', vals);
    }

    function getPlaceholdersFor(arr) {
        if (arr.length == 0) return "";
        return (new Array(arr.length)).join("?,") + "?";
    }

    $.WebSQL('spoti').query(
        'CREATE TABLE IF NOT EXISTS ' +
        ' playlists (id VARCHAR(25) PRIMARY KEY, name VARCHAR, image VARCHAR, followers INT,'+
        '  snapshot_id VARCHAR(10), owner_id VARCHAR, total INT, is_mine INT, is_loaded INT);',

        'CREATE TABLE IF NOT EXISTS ' +
        ' tracks (id VARCHAR(25) PRIMARY KEY, album_id VARCHAR(25), name VARCHAR, is_local INT, '+
            'duration INT, album VARCHAR, artists VARCHAR);',

        'CREATE TABLE IF NOT EXISTS ' +
        ' artists (id VARCHAR(25) PRIMARY KEY, name VARCHAR,'+
            'tracks INT);',

        'CREATE TABLE IF NOT EXISTS ' +
        ' albums (id VARCHAR(25) PRIMARY KEY, name VARCHAR,'+
            'artists VARCHAR, tracks INT);',



        'CREATE TABLE IF NOT EXISTS ' +
        ' playlists_tracks (playlist_id VARCHAR(25), track_id VARCHAR(25), added_at INTEGER, idx INT);',
        //'CREATE UNIQUE INDEX IF NOT EXISTS playlists_tracks_unique ON playlists_tracks (playlist_id, track_id);',

        'CREATE TABLE IF NOT EXISTS ' +
        ' artists_tracks (artist_id VARCHAR(25), track_id VARCHAR(25));',
        'CREATE UNIQUE INDEX IF NOT EXISTS artists_tracks_unique ON artists_tracks (artist_id, track_id);'

    ).fail(function (tx, err) {
        console.error(err);
        Rollbar.error('dbInitialize error: ' + err.message);
    });
}

spoti.service('SpotiDB', ['$q', SpotiDB]);
function SpotiDB($q) {
    var db = $.WebSQL('spoti');

    this.query = function(sql, params) {
        if (typeof params != 'object'
            && typeof params != 'undefined')
                params = [params];

        var promise;
        if (typeof params == 'undefined')
            promise = db.query(sql);
        else
            promise = db.query(sql, params);

        return wrap_promise(promise, [sql, params]);
    };

    this.queries = function() {
        var promise = db.query.apply(db, arguments);
        return wrap_promise(promise, arguments);
    };

    function wrap_promise(promise, log_data) {
        var deferred = $q.defer();

        promise.fail(function db_error(tx, err){
            console.error(err, log_data);
            Rollbar.log(err.message, log_data);
            toast_something_wrong();
            deferred.reject();
        }).done(deferred.resolve);

        return deferred.promise;
    }
}

})();

/*

 To clean DB:
 $.WebSQL('spoti').query('DROP TABLE IF EXISTS playlists');
 $.WebSQL('spoti').query('DROP TABLE IF EXISTS tracks');
 $.WebSQL('spoti').query('DROP TABLE IF EXISTS artists');
 $.WebSQL('spoti').query('DROP TABLE IF EXISTS albums');
 $.WebSQL('spoti').query('DROP TABLE IF EXISTS artists_tracks');
 $.WebSQL('spoti').query('DROP TABLE IF EXISTS playlists_tracks');
 ...
 */
