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
      var localSystem=beacons.getLocalSystem(layer);
      if (localSystem.downVectorLength) {
        size*=localSystem.scale;
      }
      size/=2;
      var coordinates=[];
      var proj=localSystem.proj;
      angular.forEach([
        [center[0]-size,center[1]-size],
        [center[0]+size,center[1]-size],
        [center[0]+size,center[1]+size],
        [center[0]-size,center[1]+size],
        [center[0]-size,center[1]-size],
      ], function(coords){
        if (proj) {
          coordinates.push(proj4(proj,'WGS84',coords));
        } else {
          coordinates.push(coords);
        }
      });
      return coordinates;
    } // geojson_square_coordinates

    angular.extend(beacons,{
      http_origin: document.location.origin,

      getLocalSystem: function beacons_getLocalSystem(layer){
        var baselayer=layer.scope.getCurrentLayer();
        return layer.localsystem && layer.localsystem[baselayer._name];
      }, // getLocalSystem

      updateAxis: function beacons_updateAxis(layer){
        for (var name in layer.localsystem) {
          var localsystem=layer.localsystem[name];
          localsystem.axis={};

          // vector for vertical axis
          var u=localsystem.axis.Y=[
            localsystem.downVector[0]-localsystem.origin[0],
            localsystem.downVector[1]-localsystem.origin[1]
          ];

          // unit vector for vertical axis
          var distance=localsystem.downVectorLength||Math.sqrt(u[0]*u[0]+u[1]*u[1]);
          u[0]/=distance;
          u[1]/=distance;

          // one meter in pixels
          localsystem.scale=Math.sqrt(u[0]*u[0]+u[1]*u[1]);

          // unit vector for horizontal axis (orthogonal to Y, rotated counter-clockwise)
          var v=localsystem.axis.X=[
            u[1],
            -u[0]
          ];

          if (localsystem.invertYaxis) {
            u[0]=-u[0];
            u[1]=-u[1];
          }

          if (localsystem.invertXaxis) {
            v[0]=-v[0];
            v[1]=-v[1];
          }

          if (localsystem.switchAxis) {
            localsystem.axis.X=u;
            localsystem.axis.Y=v;
          }

        }
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

          layer.scope.$on('baseLayerChanged',function(){
              beacons.resetFeatureGroup(layer);
              if (layer.visible) {
                layer.scope.updateGeoJSON(layer);
              }
          });

          layer.scope.$on('overlayChanged',function(e,originalEvent,data){
            if (data.leafletEvent.name==layer.description) {
              beacons.resetFeatureGroup(layer);
              if (originalEvent.name.split('.').pop()=='overlayadd') {
                layer.visible=true;
                layer.scope.updateGeoJSON(layer);
              } else {
                layer.visible=false;
              }
            }
        });

          layer.scope.$on('zoomEvent',function(e,originalEvent){
            if (layer.visible) {
              if (originalEvent.name.split('.').pop()=='zoomstart') {
                $('.leaflet-label').hide(0);
              } else {
                beacons.resetFeatureGroup(layer);
                layer.scope.updateGeoJSON(layer);
                $('.leaflet-label').show(0);
              }
            }
          });

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

      resetFeatureGroup: function resetFeatureGroup(layer){
        var fg_layer=layer.scope.getGeoJSONLayer(layer.name);
        if (fg_layer) {
          // store the feature group layer reference here
          // beacause it will not be found on overlay remove !
          layer.fg_layer=fg_layer;
          fg_layer.clearLayers();
        } else {
          if (layer.fg_layer) {
            layer.fg_layer.clearLayers();
            layer.fg_layer=null;
          }
        }
        for (var labelId in layer.scope.labels) {
          if (labelId.split('.')[0]==layer.name) {
            delete layer.scope.labels[labelId];
          }
        }
      }, // resetFeatureGroup

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
                row.x=Number(row.x)+(Math.random()-0.5)*4.2;
                row.y=Number(row.y)+(Math.random()-0.5)*4.2;
//                console.log(row);
              });
              res.data.rows.push({x:0, y:0, shortname: 'zero'});
              res.data.rows.push({x:0, y:10, shortname: 'zeroten'});
              res.data.rows.push({x:10, y:10, shortname: 'tenten'});
              res.data.rows.push({x:18, y:10, shortname: 'tenten'});
              res.data.rows.push({x:18, y:0, shortname: 'tenten'});
              res.data.rows.push({x:12, y:0, shortname: 'tenten'});
              res.data.rows.push({x:6, y:0, shortname: 'tenten'});
              res.data.rows.push({x:0, y:5, shortname: 'tenten'});
              res.data.rows.push({x:9, y:5, shortname: 'tenten'});
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
        var localsystem=beacons.getLocalSystem(layer);
        if (!localsystem.axis) {
          return {};
        };

        // get local coordinates system world axis origin and unit vectors
        var u=localsystem.axis.X;
        var v=localsystem.axis.Y;
        var origin=localsystem.origin;

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

          var latlng;
          if (localsystem.proj) {
            // convert coordinates to WGS84
            var wgs84=proj4(localsystem.proj,'WGS84',coords);
            latlng={
              lat: wgs84[1],
              lng: wgs84[0]
            };
          }  else {
            latlng=[coords[1],coords[0]];
          }

          // add feature to list
          features.push({
            type: "Feature",
            properties: {
              layerName: layer.name,
              description: row.shortname,
              latlng: latlng
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
