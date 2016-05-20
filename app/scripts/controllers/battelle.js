/*
 * battelle.js
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
 * @ngdoc function
 * @name webmappApp.controller:BattelleCtrl
 * @description
 * # BattelleCtrl
 * Controller of the webmappApp
 */
angular.module('webmappApp')
  .controller('BattelleCtrl', function ($scope,$http,$location,$timeout,notify,leafletData,leafletDrawEvents,$q) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $timeout(function(){
      $scope.map=leafletData.getMap();
      $scope.map.then(function(map){
        $scope.map=map;
      });
    },1000);


/*
    var cH = $('#crosshair-h');
    var cV = $('#crosshair-v');
    $(document).on('mousemove',function(e){
      if ($scope.hairVisible) {
        cH.css('top',e.pageY);
        cV.css('left',e.pageX);
      }
    });
*/

    $scope.center={
        lng: 6,
        lat: 46,
        zoom: 8
    };

    $scope.drawnItems=new L.FeatureGroup();

    angular.extend($scope, {
      center: {
        lng: 8,
        lat: 47,
        zoom: 8
      },

      layers: {},

      // load layers if not done yet, an run initLayers()
      loadLayers: function loadLayers(url) {
          var scope=this;
          var q=$q.defer();

          if (scope.json) {
            q.resolve();

          } else {
            url=url||'layers/battelle/layers.json';
            $http.get(url)
            .then(function(res){
              if (res.status!=200) {
                notify.message('Could not load layers from "'+url+'".');
                q.reject();
              } else {
                $scope.initLayers(res)
                .then(q.resolve);
              }
            });
          }

          return q.promise;

      }, // loadLayers

      // parse layers.json and initialize layers
      initLayers: function initLayers(res){
        var pathname=res.config.url.replace(/layers\.json.*/,'');
        var center;
        var layers={};
        var todo=0;

        angular.forEach(res.data,function(layer,layerName){
          ++todo;
        });

        var q=$q.defer();

        function doneOne(){
          --todo;
          if (!todo) {
            q.resolve();
          }
        }

        angular.forEach(res.data,function(layer,layerName){
          var layerClass;

          if (layer.baseLayer) {
            layerClass='baselayers';

            if (!center && layer.visible) {
              var coords=proj4(layer.projection,'WGS84',layer.center);
              center={
                lng: coords[0],
                lat: coords[1],
                zoom: (layer.options.minZoom!==undefined)?Math.floor(layer.options.minZoom+(layer.options.maxZoom-layer.options.minZoom)/3):8
              };
            }

          } else {
            layerClass='overlays';
          }

          var list=layers[layerClass];
          if (!list) {
            list=layers[layerClass]={};
          }

          if (layer.type=='geoJSONShape') {
            $http.get(pathname+layer.url).then(function(res){
              list[layerName]={
                name: layer.description || layerName,
                type: layer.type,
                data: res.data,
                visible: layer.visible || false,
                layerParams: layer.options || {}
              };
              doneOne();
            });

          } else {
            list[layerName]={
              name: layer.description || layerName,
              url: pathname+layer.url,
              type: layer.type,
              visible: layer.visible || false,
              layerParams: layer.options || {}
            };
            doneOne();
          }

        });

        q.promise.then(function(){
          angular.extend($scope, {
            center: center || $scope.center,
            layers: layers || $scope.layers
          });
        });

        return q.promise;

      }, // initLayers

      // ui-leaflet controls
      controls: {
        scale: {
          imperial: false
        },
        minimap: {
            type: 'minimap',
            layer: {
                name: 'OpenStreetMap',
                url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                type: 'xyz'
            },
            toggleDisplay: true
        },
        custom: [
          $scope.saveButton=L.easyButton({
            states: [{
            title: 'Save shapes',
            icon: 'fa-save fa-lg',
            onClick: function(btn, map) {
              if (!$scope.downloadlink) {
                $scope.downloadLink=document.createElement("a");
                $scope.downloadLink.download='battelle-geojson.json';
              }
              $scope.downloadLink.href='data:text/json;charset=utf-8,'+encodeURIComponent($scope.object_list.join(','));
              $scope.downloadLink.click();
            }
            }]
          }),
//        L.control.locate({follow: true}),
          L.easyButton({
            states: [{
              title: 'Toggle crosshair',
              icon: 'fa-crosshairs fa-lg',
              onClick: function(btn, map) {
                var hair=$('.hair');
                if (hair.is(':visible')) {
                  hair.hide(0);
                  $('#mousecoords').hide();
                  $scope.hairVisible=false;
        //          $('#lf-battelle').css('cursor','');
                } else {
                  hair.show(0);
                  $('#mousecoords').show();
                  $scope.hairVisible=true;
        //          $('#lf-battelle').css('cursor','none');
                }
              }
            }]
          })
        ]

      }, // controls

      // ui-leaflet-draw options
      drawOptions: {
          draw: {
              polyline: {
                metric: false
              },
              polygon: {
                metric: false,
                showArea: true,
                drawError: {
                  color: '#b00b00',
                  timeout: 1000
                },
                shapeOptions: {
                  color: 'blue'
                }
              },
              circle: {
                showArea: true,
                metric: false,
                shapeOptions: {
                  color: '#662d91'
                }
              },
              marker: false
          },
          edit: {
            featureGroup: $scope.drawnItems,
            remove: true
          }

      }, // drawOptions

      // ui-leaflet-draw event handlers
      drawEventHandlers: {
        created: function(e,leafletEvent, leafletObject, model, modelName) {
          $scope.drawnItems.addLayer(leafletEvent.layer);
          $scope.updateObjectList();
        },
        edited: function(arg) {
          $scope.updateObjectList();
        },
        deleted: function(e,leafletEvent) {
          $scope.drawnItems.removeLayer(leafletEvent.layers);
          $scope.updateObjectList();
        },
        drawstart: function(arg) {},
        drawstop: function(arg) {},
        editstart: function(arg) {},
        editstop: function(arg) {},
        deletestart: function(arg) {},
        deletestop: function(arg) {}

      }, // drawEventHandlers

      updateObjectList: function updateObjectList() {
        var object_list=$scope.object_list=[];
        angular.forEach($scope.drawnItems._layers,function(layer){
          object_list.push(JSON.stringify(layer.toGeoJSON(),null,4));
        });
        $scope.saveButton[object_list.length?'enable':'disable']();

      }, // updateObjectList

      // ui-leaflet events we want to receive
      events: {
          map: {
            enable: ['mousemove', 'mousedown', 'move', 'moveend'],
            logic: 'emit'
          }
      }, // events

      mouseCoords: {
        LV95: [0,0],
        WGS84: [0,0]
      },

      centerCoords: {
        LV95: [0,0],
        WGS84: [0,0]
      },

      coordsToDisplay: 'centerCoords',

      coordsProjection: 'LV95',

      // coords to be displayd in view
      getCoordsToDisplay: function getCoordsToDisplay(){
        var scope=this;
        var coords=scope.coordsToDisplay && scope[scope.coordsToDisplay] && scope[scope.coordsToDisplay][scope.coordsProjection];
        if (coords) {
          return coords[0].toFixed(8)+', '+coords[1].toFixed(8);
        } else {
          return 'not available';
        }
      },

      // get and update scope.centerCoords from map center coordinates
      getCenter: function getCenter(){
        var scope=this;
        if (scope.map) {
          var coords=scope.map.getCenter();
          scope.centerCoords.WGS84=[coords.lng,coords.lat];
          scope.centerCoords.LV95=proj4('WGS84','EPSG:2056',[coords.lng,coords.lat]);
        }
        return scope.centerCoords;
      },

      // get and update scope.mousecCoords from leaflet mouse event coordinates
      getMouseCoords: function getMouseCoords(leafletMouseEvent) {
        var scope=this;
        var coords=(leafletMouseEvent||scope.leafletMouseEvent).latlng;
        scope.mouseCoords.WGS84=[coords.lng,coords.lat];
        scope.mouseCoords.LV95=proj4('WGS84','EPSG:2056',[coords.lng,coords.lat]);
        return scope.mouseCoords;

      }, // getMouseCoords

      setupEventHandlers: function setupEventHandlers(){
        var scope=this;

        // update scope.leafletEvent on mousemove (convert coordinates only when needed)
        scope.$on('leafletDirectiveMap.lf-battelle.mousemove', function(event, args){
            scope.leafletEvent=args.leafletEvent;
        });

        // update scope.centerCoords on map move
        scope.$on('leafletDirectiveMap.lf-battelle.move', function(event, args){
          scope.getCenter();
        });

        // bind leaflet-draw event handlers
        var drawEvents = leafletDrawEvents.getAvailableEvents();
        angular.forEach(scope.drawEventHandlers,function(handler, eventName){
            eventName='draw:'+eventName;
            var idx=drawEvents.indexOf(eventName);
            if (idx<0) {
                console.log('Error: unknown drawEvent '+eventName);
            } else {
                drawEvents.splice(idx,1);
            }
            scope.$on('leafletDirectiveDraw.lf-battelle.' + eventName, function(e, payload) {
              var p=payload;
              handler(e, p.leafletEvent, p.leafletObject, p.model, p.modelName);
            });
        });
        if (drawEvents.length) {
          console.log('warning: no handlers for the following drawEvents:',drawEvents);
        }

        scope.$on("centerUrlHash", function(event, centerHash) {
    // setting location search cause a viewreset each time and infinite loop when zoom level > maxNativeZoom, so disable it for now..
    //        $location.search({ c: centerHash });
    // and store centerHash instead (for permalink)
          scope.centerHash=centerHash;
        });

      }, // setupEventHandlers

      init: function init(){
        var q=$q.defer();

        $scope.saveButton.disable();

        $scope.loadLayers().then(function success(){
          $scope.setupEventHandlers();
          q.resolve();

        }, function error(err){
          q.reject(err);
        });

        return q.promise;

      } // init

    });

    $scope.geojson={
      style: {
          fillColor: "green",
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
      }
    };

    $scope.init().then(function(){

      // iterate: get the lates geojson (server should make it a long poll)
      function iter(){
        var q=$q.defer();
        $http.get('layers/battelle/live.geojson?'+Date.now()).then(function success(res){
          console.log(res.data);
          q.resolve(res.data);

        }, function error(res){
          console.log(res);
          q.reject(new Error('Could not load layers/battelle/live.geojson'));

        });

        return q.promise;
      } // iter

      // infinite loop: iterate indefinitely
      function loop() {
        iter().then(function(data){
          $scope.geojson.data=data;

          $timeout(function(){
              loop();
          },5000);

        }, function fail(err) {
          notify.message(err.message);
          $timeout(function(){
            loop();
          },5000);
        });
      } // loop

      loop();

    });

  });
