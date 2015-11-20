(function() {
  spoti.service('Load',
            ['$q', 'SpotiDB', 'oauth', 'GlobalFilter', Load]);
  function Load($q, SpotiDB, oauth, GlobalFilter) {

    this.get_playlists_config = function() {
      return SpotiDB.query('SELECT snapshot_id, is_loaded, id FROM playlists;');
    };

    this.get_list = function(table) {
        return crazy_mazafaka_query(table)
    };

    this.get_playlist_for_queue = function() {
      return SpotiDB.query('SELECT id, snapshot_id FROM playlists ' +
          'WHERE owner_id=? AND name=? LIMIT 1;', [user_id, SPOTIPLAY_QUEUE_NAME]);
    };

    // ------- PRIVATE: -------

    function crazy_mazafaka_query(table){
      var select = 'SELECT '+table+'.* ';
      var from = 'FROM '+table;
      var relation_to = sql_for[table];
      var commonJoin = '',
        joins='', join_params = [],
        where='WHERE 1', where_params = [],
        group = 'GROUP BY '+table+'.id';

      Object.keys(GlobalFilter.tags)
        .forEach(function (relation_key) {
            if (GlobalFilter.tags[relation_key])
              fill_vars(relation_to[relation_key], GlobalFilter.tags[relation_key].id);
      });

      if (table == 'tracks' && GlobalFilter.tags.playlists) {
        select += ', idx';
        group += ', idx';
      }

      if (!GlobalFilter.tags.playlists && typeof GlobalFilter.ownership == "boolean")
        fill_vars(relation_to.ownership, GlobalFilter.ownership);




      function fill_vars(statements, value) {
        var is_param_pushed = false;
        if (statements.commonJoin)
          commonJoin = relation_to.commonJoin;

        if (statements.where){
          where += ' AND ' + statements.where;
          where_params.push(value);
          is_param_pushed = true;
        }

        if (statements.join) {
          joins += ' ' + statements.join;
          if (!is_param_pushed) join_params.push(value);
        }
      }


      var q = [select, from, commonJoin, joins, where, group].join(' ');
      log(q, join_params, where_params);
      return SpotiDB.query(q, join_params.concat(where_params));
    }
  }

  var sql_for = { rows: 0 }; // rows - is for noise
  
  sql_for.playlists = { 
    commonJoin: 'JOIN playlists_tracks ON (playlists.id=playlists_tracks.playlist_id)',
  
    playlists: {where: 'playlists.id=?'},
    ownership: {where: 'playlists.is_mine=?'},

    artists: {commonJoin: true,
      join:'JOIN artists_tracks ON (playlists_tracks.track_id=artists_tracks.track_id AND artist_id=?)'},
  
    albums: {commonJoin: true,
      join: 'JOIN tracks ON (playlists_tracks.track_id=tracks.id AND album_id=?)'}
  };
  
  sql_for.tracks = { 
    playlists: {join: 'JOIN playlists_tracks ON (tracks.id=playlists_tracks.track_id AND playlist_id=?)'},
    ownership: {join: 'JOIN playlists_tracks ON (tracks.id=playlists_tracks.track_id) '+
        'JOIN playlists ON (playlists_tracks.playlist_id=playlists.id)',
        where: 'playlists.is_mine=?'},
    artists: {join: 'JOIN artists_tracks ON (tracks.id=artists_tracks.track_id AND artist_id=?)'},
    albums: {where: 'tracks.album_id=?'}
  };
  
  sql_for.artists = { 
    commonJoin: 'JOIN artists_tracks ON (artists.id=artists_tracks.artist_id) ',
      
    playlists: {commonJoin: true,
      join: 'JOIN playlists_tracks ON (artists_tracks.track_id=playlists_tracks.track_id AND playlist_id=?)'
    },
    ownership: {commonJoin: true,
      join: 'JOIN playlists_tracks ON (artists_tracks.track_id=playlists_tracks.track_id) '+
      'JOIN playlists ON (playlists_tracks.playlist_id=playlists.id)',
      where: 'playlists.is_mine=?'},
  
    artists: {where: 'artists.id=?'},
  
    albums: {commonJoin: true,
      join: 'JOIN tracks ON (artists_tracks.track_id=tracks.id) ',
      where: 'tracks.album_id=?'}
  };
  
  sql_for.albums = {
    commonJoin: 'JOIN tracks ON (albums.id=tracks.album_id)',
      
    playlists: {commonJoin: true,
      join: 'JOIN playlists_tracks ON (tracks.id=playlists_tracks.track_id AND playlist_id=?)'},
    ownership: {commonJoin: true,
      join: 'JOIN playlists_tracks ON (tracks.id=playlists_tracks.track_id)'+
      'JOIN playlists ON (playlists_tracks.playlist_id=playlists.id)',
      where: 'playlists.is_mine=?'},
  
    artists: {commonJoin: true,
      join: 'JOIN artists_tracks ON (tracks.id=artists_tracks.track_id AND artist_id=?)'},
  
    albums: {where: 'albums.id=?'}
  };

})();
