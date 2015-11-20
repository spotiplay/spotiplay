(function(){
    'use strict';

    spoti.service('Tabs',
        ['GlobalFilter', '$emit', Tabs]);
    function Tabs(GlobalFilter, $emit) {

        var self = this;

        this.tabs = [];
        this.state = {selectedIndex: 0};


        this.select = function(i) {
            self.mute_current_tab();
            var current_tab = self.tabs[i];
            if (current_tab.type != 'tracks')
                GlobalFilter.remove_tag(current_tab.type);
            self.load_tab(current_tab);
            $emit('tab_changed', current_tab);
            return current_tab;
        };

        taba('Playlists', 'playlists', [
            {name: 'Name', field: 'name', default: true},
            {name: 'Followers', field: 'followers', reverse: true},
            {name: 'Total tracks', field: 'total', reverse: true}
        ]);
        taba('Artists', 'artists', [
            {name: 'Name', field: 'name', default: true},
            {name: 'Total tracks', field: 'tracks', reverse: true}
        ]);
        taba('Tracks', 'tracks', [
            {name: 'Name', field: 'name'},
            {name: 'Playlist order', field: 'idx', default: true}
        ]);
        taba('Albums', 'albums', [
            {name: 'Name', field: 'name', default: true},
            {name: 'Total tracks', field: 'tracks', reverse: true}
        ]);

        function taba(title, type, arrange_options) {
            var tab = {
                title: title,
                type: type,
                fields: {name: ''}
            };

            var arrange_by;
            arrange_options.forEach(function(o){
                if (o.default == true)  arrange_by = o.field;
            });

            tab.filter = {
                arrange_by: arrange_by,
                reverse: false,
                limit:30,

                arrange_options: arrange_options,
                limit_options: [30, 100, 300, 1000]
            };
            self.tabs.push(tab);
        }
    }

})();