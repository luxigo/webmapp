'use strict';

/**
 * @ngdoc directive
 * @name webmappApp.directive:search
 * @description
 * # search
 */
angular.module('webmappApp')
  .directive('search', function ($timeout) {
    return {
      templateUrl: 'views/search.html',
      restrict: 'E',
      scope: {
        delay: '@',
        onsearch: '&'
      },
      link: function postLink(scope, element, attrs) {
        element.on('keyup',function(e){
          $timeout.cancel(scope._keyupTimeout);
          if (e.keyCode==27) {
            $(e.target).val('');
            $timeout(function(){
              scope.onsearch({val:''});
            });
            return;
          }
          scope._keyupTimeout=$timeout(function(){
            if (typeof(scope.onsearch)=='function') {
              scope.onsearch({
                val: $(e.target).val()
              });
            }
          },scope.timeout);
        });
      }
    };
  });
