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


// add LV95 definition to proj4
proj4.defs('EPSG:2056', "+title=LV95 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");
proj4.defs('LV95', "+title=LV95 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");
proj4.defs('MN95', "+title=MN95 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");
