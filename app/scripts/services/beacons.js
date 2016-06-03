/*
 * beacons.js
 *
 * Copyright (c) 2016 ALSENET SA
 *
 * Author(s):
 *
 *      Luc Deschenaux <luc.deschenaux@freesurf.ch>
 * *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Additional Terms:
 *
 *      You are required to preserve legal notices and author attributions in
 *      that material or in the Appropriate Legal Notices displayed by works
 *      containing it.
 *
 *      You are required to attribute the work as explained in the "Usage and
 *      Attribution" section of <http://doxel.org/license>.
 */

'use strict';

/**
 * @ngdoc service
 * @name webmappApp.beacons
 * @description
 * # beacons
 * Service in the webmappApp.
 */
angular.module('webmappApp')
  .service('beacons', function ($http) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var beacons=this;

    function geojson_square_coordinates(center,size){
      size/=2;
      var coordinates=[];

      angular.forEach([
        [center[0]-size,center[1]-size],
        [center[0]+size,center[1]-size],
        [center[0]+size,center[1]+size],
        [center[0]-size,center[1]+size],
        [center[0]-size,center[1]-size],
      ], function(coords){
        coordinates.push(proj4(beacons.geolocation.proj,'WGS84',coords));
      });

      return coordinates;
    } // geojson_square_coordinates

    angular.extend(beacons,{
      http_origin: document.location.origin,

      geolocation: {
        proj: 'EPSG:2056',
        // origin
        origin: [ 2499670.90206156, 1114753.42399633 ],
        // vertical axis
        downVector: [ 2499680.14609066, 1114764.71805181 ]
      },

      updateAxis: function beacons_updateAxis(){
        beacons.axis={};

        // vector for vertical axis
        var u=beacons.axis.Y=[
          beacons.geolocation.downVector[0]-beacons.geolocation.origin[0],
          beacons.geolocation.downVector[1]-beacons.geolocation.origin[1]
        ];

        // unit vector for vertical axis
        var norm=Math.sqrt(u[0]*u[0]+u[1]*u[1]);
        u[0]/=norm;
        u[1]/=norm;

        // unit vector for horizontal axis (orthogonal to Y, rotated counter-clockwise)
        var v=beacons.axis.X=[
          u[1],
          -u[0]
        ];
      }, // beacon_updateAxis

      find: function beacons_find(options,callback){
        $http({
          method: 'GET',
          url: beacons.http_origin+'/cassandra/beacons.json'

        }).then(function success(response){
          console.log(response);
          callback(null,response.data.rows);

        }, function error(response){
          callback(response.status,response.data.rows);

        });
      }, // beacons_find

      toGeoJSON: function beacons_toGeoJSON(rows){
        if (!beacons.axis) {
          return {};
        };
  //      rows.push({shortname: 'ZERO', x:0, y:0});
        var u=beacons.axis.X;
        var v=beacons.axis.Y;
        var origin=beacons.geolocation.origin;
        var features=[];

        angular.forEach(rows,function(row){
          var x=Number(row.x);
          var y=Number(row.y);

          // could use something like haversine here
          // but error is negligible for small distances
          var coords=[
            origin[0]+x*u[0]+y*v[0],
            origin[1]+x*u[1]+y*v[1]
          ];

          row.coords=coords;
          var wgs84=proj4(beacons.geolocation.proj,'WGS84',coords);
          var latlng={
            lat: wgs84[1],
            lng: wgs84[0]
          };

          features.push({
            type: "Feature",
            properties: {
              description: row.shortname,
              latlng: {
                lat: wgs84[1],
                lng: wgs84[0]
              }

            },
            geometry: {
              type: "Polygon",
              coordinates: [geojson_square_coordinates(coords,0.5)]
            }
          });

        });

        return {
          type: "FeatureCollection",
          features: features
        }

      } // beacons_toGeoJSON

    });

    beacons.updateAxis();

  });
