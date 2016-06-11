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
  .service('beacons', function ($http,$timeout,$q) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var beacons=this;

    // return an array of WGS84 coodinates for a square of the given
    // side size (in localsystem.proj unit) at the given
    // center (in localsystem.proj coordinates)
    function geojson_square_coordinates(layer,center,size){
      size/=2;
      var coordinates=[];

      angular.forEach([
        [center[0]-size,center[1]-size],
        [center[0]+size,center[1]-size],
        [center[0]+size,center[1]+size],
        [center[0]-size,center[1]+size],
        [center[0]-size,center[1]-size],
      ], function(coords){
        coordinates.push(proj4(layer.localsystem.proj,'WGS84',coords));
      });

      return coordinates;
    } // geojson_square_coordinates

    angular.extend(beacons,{
      http_origin: document.location.origin,

      updateAxis: function beacons_updateAxis(layer){
        layer.localsystem.axis={};

        // vector for vertical axis
        var u=layer.localsystem.axis.Y=[
          layer.localsystem.downVector[0]-layer.localsystem.origin[0],
          layer.localsystem.downVector[1]-layer.localsystem.origin[1]
        ];

        // unit vector for vertical axis
        var norm=Math.sqrt(u[0]*u[0]+u[1]*u[1]);
        u[0]/=norm;
        u[1]/=norm;

        // unit vector for horizontal axis (orthogonal to Y, rotated counter-clockwise)
        var v=layer.localsystem.axis.X=[
          u[1],
          -u[0]
        ];
      }, // beacon_updateAxis

      polygonSize: 0.5,

      getPolygonCoordinates: function beacon_getPolygonCoordinates(layer,center) {
        return geojson_square_coordinates(layer,center,beacons.polygonSize);
      },

      // prepare layer geojson and setup layer refresh loop
      onload: function beacons_onload(layer,res,callback){
        if (res && res.data && res.data.error) {
          return callback(new Error(res.data.error),null);

        } else {

          // setup local coordinate system axis
          beacons.updateAxis(layer);

          // setup layer properties
          layer.getPolygonCoordinates=beacons.getPolygonCoordinates;
          layer.data=res.data;
          layer.rows=layer.data.rows;
          layer.geojson=beacons.toGeoJSON(layer);
          layer.scope.$on('updateSearchString',function(){
              layer.scope.updateGeoJSON(layer);
          });
          /*
          layer.scope.map.on('overlayadd',function(e){
            $scope.onOverlayAdd(layer,e);
          });
          */

          // setup refresh loop
          if (layer.refresh) {
            $timeout(function(){
              beacons.loop(layer);
            },Number(layer.refresh)+3000);
          }

          // return geojson
          callback(null,{data: layer.geojson});
        }

      }, // beacons_onload

      // iterate: get the latest geojson (server should make it a long poll)
      iter: function iter(layer){
        var q=$q.defer();

        // dont fetch data if the layer is not displayed
        if (layer.scope.getGeoJSONLayer(layer.name)==null) {
          $timeout(function(){
            q.resolve(null);
          },Number(layer.refresh));
          return q.promise;
        }

        // fetch data
        $http.get(layer.url).then(function(res){
          if (res.data.error) {
            console.log(layer.url,res.data.error);
            return q.reject(new Error(res.data.error));
          } else {
            // for testing
            if (false)  {
              res.data.rows.forEach(function(row){
                row.x=Number(row.x)+(Math.random()-0.5)*0.2;
                row.y=Number(row.y)+(Math.random()-0.5)*0.2;
                console.log(row);
              });
            }
            return q.resolve(res);
          }
        }, function(err){
          console.log(layer.url,err);
          q.reject(new Error('Could not update layer "'+layer.description+'"'));
        });
        return q.promise;

      }, // iter

      // loop: iterate indefinitely
      loop: function loop(layer) {
        beacons.iter(layer).then(function(res){
          if (res) {
            layer.data=res.data;
            layer.geojson=beacons.toGeoJSON(layer);
            layer.scope.updateGeoJSON(layer);
          }
          $timeout(function(){
              loop(layer);
          },Number(layer.refresh));

        }, function fail(err) {
          layer.scope.notify.message(err.message);
          $timeout(function(){
            loop(layer);
          },Number(layer.refresh));
        });
      }, // loop

      // return feature collection geojson for given layer
      toGeoJSON: function beacons_toGeoJSON(layer){
        if (!layer.localsystem.axis) {
          return {};
        };

        // get local coordinates system world axis origin and unit vectors
        var u=layer.localsystem.axis.X;
        var v=layer.localsystem.axis.Y;
        var origin=layer.localsystem.origin;

        // generate geojson features list
        var features=[];
        angular.forEach(layer.rows,function(row){
          var x=Number(row.x);
          var y=Number(row.y);

          // convert local coordinates to world coordinates
          // could use something like haversine here
          // but error is negligible for small distances
          var coords=[
            origin[0]+x*u[0]+y*v[0],
            origin[1]+x*u[1]+y*v[1]
          ];
          // store world coordinates
          row.coords=coords;

          // convert coordinates to WGS84
          var wgs84=proj4(layer.localsystem.proj,'WGS84',coords);
          var latlng={
            lat: wgs84[1],
            lng: wgs84[0]
          };

          // add feature to list
          features.push({
            type: "Feature",
            properties: {
              layerName: layer.name,
              description: row.shortname,
              latlng: {
                lat: wgs84[1],
                lng: wgs84[0]
              }
            },
            geometry: {
              type: "Polygon",
              coordinates: [layer.getPolygonCoordinates(layer,coords)]
            }
          });

        });

        // return geojson feature collection
        return {
          type: "FeatureCollection",
          features: features
        }

      } // beacons_toGeoJSON

    });

  });
