(function(){
    'use strict';

    spoti
       .controller('TagsController', [
          '$q',
            Controller
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function Controller($q) {
    var self = this;

      self.searchText = null;
      self.selectedVegetables = [];

      self.querySearch = function(query) {
          var results = query ? self.vegObjs.filter(createFilterFor(query)) : [];
          results.push({
              'name' : query,
              'type' : 'new'
          });
          return results;
      };

      self.onItemChanged = function(it) {
          log(it);
      };


      function createFilterFor(query) {
          var lowercaseQuery = angular.lowercase(query);
          return function filterFn(vegetable) {
              return (vegetable._lowername.indexOf(lowercaseQuery) === 0);
          };

      }

      self.readonly = false;
      // Lists of fruit names and Vegetable objects
      self.fruitNames = ['Apple', 'Banana', 'Orange'];
      self.roFruitNames = angular.copy(self.fruitNames);
      self.tags = [];
      self.vegObjs = [
          {
              'name' : 'Broccoli',
              'type' : '2'
          },
          {
              'name' : 'Cabbage',
              'type' : '33'
          },
          {
              'name' : 'Cartofel',
              'type' : '43'
          },
          {
              'name' : 'Cannabis',
              'type' : '12'
          },
          {
              'name' : 'Carrot',
              'type' : '3'
          }
      ];

      self.vegObjs = self.vegObjs.map(function (veg) {
          veg._lowername = veg.name.toLowerCase();
          veg._lowertype = veg.type.toLowerCase();
          return veg;
      });

      self.newVeg = function(chip) {
          return {
              name: chip,
              type: 'unknown'
          };
      };

  }

})();