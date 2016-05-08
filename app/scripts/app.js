'use strict';

/**
 * @ngdoc overview
 * @name trackerApp
 * @description
 * # trackerApp
 *
 * Main module of the application.
 */
angular
  .module('trackerApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'leaflet-directive'
  ])
  .config(function ($routeProvider) {
    $routeProvider
/*      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
*/
      .when('/Battelle', {
        templateUrl: 'views/battelle.html',
        controller: 'BattelleCtrl',
        controllerAs: 'battelle'
      })
      .otherwise({
        redirectTo: '/Battelle'
      });
  });
