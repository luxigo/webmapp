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
  .controller('BattelleCtrl', function ($scope,$http,$location,$timeout,notify,leafletData,leafletDrawEvents,$q,beacons) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $timeout(function(){
      $scope.map=leafletData.getMap('lf-battelle');
      $scope.map.then(function(map){
        window.map=map;
        map.scope=$scope;
        $scope.map=map;
        $scope.map.on('overlayremove',function(e){
          var layerName=$scope.getLayerByName(e.name)._name;
          $('.label-'+layerName).hide(0);
        });
        $scope.map.on('overlayadd',function(e){
          var layerName=e.name;
          $('.label-'+layerName).show(0);
        });
      });
    },1000);

    // setup crosshair
    var cH = $('#crosshair-h');
    var cV = $('#crosshair-v');
    $(document).on('mousemove',function(e){
      if ($scope.hairVisible && !$scope.hairFrozen) {
        cH.css('top',e.pageY);
        cV.css('left',e.pageX);
      }
    });

    $(document).on('keydown',function(e){
      console.log(e.keyCode);
      switch(e.keyCode) {
        case 88: // 'x'
          $scope.toggleHairFrozen();
          break;
      }
    });

    $scope.drawnItems=new L.FeatureGroup();

    angular.extend($scope, {
      center: {
        lng: 8,
        lat: 47,
        zoom: 8
      },

      bounds: null,
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

      defaults: {
//        crs: 'Simple'
      },

      getLayerBounds: function getLayerBounds(layer){

        if (layer.type=="imageOverlay") {
          return layer.bounds;
        }

        if (layer.projection && layer.bounds) {
          var tl=proj4(layer.projection,'WGS84',layer.bounds[0]);
          var br=proj4(layer.projection,'WGS84',layer.bounds[1]);
          return L.bounds([
            [tl[1],tl[0]],
            [br[1],br[0]]
          ]);

        } else {
          if (layer.bounds) {
            if (layer.bounds[0]) {
              if (layer.bounds[0].lat) {
                return L.bounds([
                  [layer.bounds[0].lat, layer.bounds[0].lng],
                  [layer.bounds[1].lat, layer.bounds[1].lng]
                ]);
              } else {
                return L.bounds([
                  [layer.bounds[0][0], layer.bounds[0][1]],
                  [layer.bounds[1][0], layer.bounds[1][1]]
                ]);
              }
            }
          }
        }
      }, // getLayerBounds

      getLayerCenter: function getLayerCenter(layer){
        if (layer.projection && layer.center) {
          var coords=proj4(layer.projection,'WGS84',layer.center);
          return L.latLng(coords[1],coords[0]);

        } else {
          return L.latLng(0,0);
        }
      },
      // parse layers.json and initialize layers
      initLayers: function initLayers(res){
        var pathname=res.config.url.replace(/layers\.json.*/,'');
        var center;
        var layers=$scope.__layers={};
        var todo=0;

        // get layers count
        angular.forEach(res.data,function(layer,layerName){
          ++todo;
        });

        var q=$q.defer();

        // we need to wait for all layers initialized before
        // passing the layers object to ui-leaflet
        function doneOne(){
          --todo;
          if (!todo) {
            q.resolve();
          }
        }

        // loop through layers.json layers
        angular.forEach(res.data,function(layer,layerName){
          var layerClass;

          if (layer.baseLayer) {
            layerClass='baselayers';

            // use first visible base layer center to center map
            if (!center && layer.visible) {
              var coords=[0,0];
              try {
                coords=proj4(layer.projection,'WGS84',layer.center);
              } catch(e) {
                console.log(e);
              }

              center={
                lng: coords[0],
                lat: coords[1],
                zoom: layer.options.initialZoom||((layer.options.minZoom!==undefined)?Math.floor(layer.options.minZoom+(layer.options.maxZoom-layer.options.minZoom)/3):8)
              };
            }

          } else {
            layerClass='overlays';
          }

          // get list of layers for current layer class (baselayers or overlays)
          var list=layers[layerClass];
          if (!list) {
            list=layers[layerClass]={};
          }

          if (layer.type=='geoJSONShape') {
            var layerURL=(layer.url.substr(0,1)=='/')?layer.url:pathname+layer.url;

            // get layer url
            $http.get(layerURL).then(function(res){
              var q=$q.defer();

              // is it a custom geojson layer for which an onload method is defined ?
              if (layer.class && $scope[layer.class] && $scope[layer.class].onload) {

                // prepare custom geojson layer
                layer.name=layerName;
                layer.scope=$scope;
                angular.extend(layer.options,{
                  onEachFeature: $scope.geojson.onEachFeature,
                  layerName: layerName
                });

                $scope[layer.class].onload(layer,res,function(err,res){
                  if (err) {
                    // custom geojson prepare failed
                    q.reject(err);
                  } else {
                    // custom geojson prepare success
                    q.resolve(res);
                  }
                });

              } else {
                // pass the standard geojson layer further
                q.resolve(res);
              }

              q.promise.then(function(res){
                // define the ui-leaflet geojson layer
                list[layerName]={
                  _name: layerName,
                  name: layer.description,
                  type: layer.type,
                  data: res.data,
                  visible: layer.visible || false,
                  __center: $scope.getLayerCenter(layer),
                  bounds: $scope.getLayerBounds(layer),
                  CRS: layer.CRS,
                  layerParams: layer.params || {},
                  layerOptions: layer.options || {}
                };
                doneOne();

              },function(err){
                // custom geojson layer prepare failed
                doneOne();
              });

            },function(err){
              // http get failed
              doneOne();
            });

          } else {
            list[layerName]={
              _name: layerName,
              name: layer.description,
              url: pathname+layer.url,
              type: layer.type,
              CRS: layer.CRS,
              visible: layer.visible || false,
              __center: $scope.getLayerCenter(layer),
              bounds: $scope.getLayerBounds(layer),
              layerParams: layer.params || {},
              layerOptions: layer.options || {}
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
              var link=$scope.downloadLink;
              var geojson={
                type: "FeatureCollection",
                features: $scope.features
              }
              link.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(geojson,null,4));
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              link.remove();
            }
            }]
          }),
//        L.control.locate({follow: true}),
          $scope.originButton=L.easyButton({
            states: [{
              title: 'Set beacons coordinates origin',
              icon: 'fa-circle-o -fa-lg',
              onClick: function(btn, map) {
                if (!$scope.hairFrozen) {
                  alert('Unexpected error');
                  return;
                }
                // TODO: axis buttons must be enabled only when a single layer with "localsystem" is displayed
                // and this layer.localsystem.origin must be updated
                beacons.geolocation.origin=angular.copy($scope.frozenCoords.LV95);
                beacons.updateAxis();
                $scope.toggleHairFrozen();
              }
            }]
          }),

          $scope.axisButton=L.easyButton({
            states: [{
              title: 'Set vertical axis from origin',
              icon: 'fa-dot-circle-o -fa-lg',
              onClick: function(btn, map) {
                if (!$scope.hairFrozen) {
                  alert('Unexpected error');
                  return;
                }
                beacons.geolocation.downVector=angular.copy($scope.frozenCoords.LV95);
                beacons.updateAxis();
                $scope.toggleHairFrozen();

              }
            }]
          }),

          L.easyButton({
            states: [{
              title: 'Toggle crosshair',
              icon: 'fa-crosshairs fa-lg',
              onClick: function(btn, map) {
                $scope.toggleCrosshair();
              }
            }]
          })
        ]

      }, // controls

      toggleCrosshair: function toggleCrosshair(){
        var hair=$('.hair');
        $scope.hairFrozen=false;
        $scope.coordsToDisplay="mouseCoords";

        if (hair.is(':visible')) {
          // hide crosshairs and coordinates
          hair.hide(0);
          $('#mousecoords').hide();
          $scope.hairVisible=false;

          // unregister mousedown handler
          if (typeof($scope.crosshairOffMousedown)=='function') {
            $scope.crosshairOffMousedown();
          }

          // show search box and cursor
          $('search').show(0);
          $('#lf-battelle').css('cursor','');

          // update buttons
          $scope.originButton.disable();
          $scope.axisButton.disable();

        } else {
          // show crosshairs and coordinates
          hair.show(0);
          $('#mousecoords').show();
          $scope.hairVisible=true;
          $scope.disableHairdown=false;

          // toggle hairfrozen mode on mousedown
          $scope.crosshairOffMousedown=$scope.$on('leafletDirectiveMap.lf-battelle.mousedown', function(event, args){
            $scope.leafletEvent=args.leafletEvent;
            // dont toggle hairfrozen when hairdown is explicitly disabled
            if ($scope.disableHairdown) {
              return;
            }
            // dont toggle hairfrozen mode when mousedown occurs over controls
            if ($($scope.leafletEvent.originalEvent.target).closest('.leaflet-control').length) {
              return;
            }
            $scope.toggleHairFrozen();
          });

          // hide search box and cursor
          $('search').hide(0);
          $('#lf-battelle').css('cursor','none');
        }
      }, // toggleCrosshair

      // ui-leaflet-draw options
      drawOptions: {
          enabled: false,
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
        drawstart: function(arg) {
          $scope.disableHairdown=true;
        },
        drawstop: function(arg) {
          $scope.disableHairdown=false;
        },
        editstart: function(arg) {
          $scope.disableHairdown=true;
        },
        editstop: function(arg) {
          $scope.disableHairdown=false;
        },
        deletestart: function(arg) {
          $scope.disableHairdown=true;
        },
        deletestop: function(arg) {
          $scope.disableHairdown=false;
        }

      }, // drawEventHandlers

      // update ui-leaflet-draw object list
      updateObjectList: function updateObjectList() {
        var features=$scope.features=[];
        console.log($scope.drawnItems._layers)
        angular.forEach($scope.drawnItems._layers,function(layer){
          features.push(layer.toGeoJSON());
        });
        $scope.saveButton[features.length?'enable':'disable']();

      }, // updateObjectList

      // ui-leaflet events we want to receive
      events: {
          map: {
            enable: ['mousemove', 'mousedown', 'move', 'moveend', 'baselayerchange', 'overlayadd', 'overlayremove', 'zoomstart', 'zoomend'],
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

      coordsToDisplay: 'mouseCoords',

      // projection when displaying mouse coords
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
        var coords=(leafletMouseEvent||scope.leafletEvent).latlng;
        scope.mouseCoords.WGS84=[coords.lng,coords.lat];
        scope.mouseCoords.LV95=proj4('WGS84','EPSG:2056',[coords.lng,coords.lat]);
        return scope.mouseCoords;

      }, // getMouseCoords

      setupEventHandlers: function setupEventHandlers(){
        var scope=this;

        // update scope.leafletEvent on mousemove (convert coordinates only when needed)
        scope.$on('leafletDirectiveMap.lf-battelle.mousemove', function(event, args){
            scope.leafletEvent=args.leafletEvent;
            scope.getMouseCoords();
        });

        // update scope.centerCoords on map move
        scope.$on('leafletDirectiveMap.lf-battelle.move', function(event, args){
          scope.getCenter();
          if (scope.hairFrozen) {
            $scope.toggleHairFrozen();
          }
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

      toggleHairFrozen: function toggleHairFrozen(){
        $scope.hairFrozen=!$scope.hairFrozen;
        if ($scope.hairFrozen) {
          $('#lf-battelle').css('cursor','');
          $scope.frozenCoords=angular.copy($scope[$scope.coordsToDisplay]);
          $scope._coordsToDisplay=$scope.coordsToDisplay;
          $scope.coordsToDisplay='frozenCoords';
          $scope.originButton.enable();
          $scope.axisButton.enable();
        } else {
          $('#lf-battelle').css('cursor','none');
          $scope.coordsToDisplay=$scope._coordsToDisplay;
          $scope.originButton.disable();
          $scope.axisButton.disable();
        }
      }, // toggleHairFrozen

      labels: {},

      labels_visible: true,

      geojson: {
        style: {
            fillColor: "green",
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        },

        onEachFeature: function geojson_onEachFeature(feature, layer) {
          // create or re-use label
          var shortname=feature.properties.description;

          // feature has no label yet ?
          if (!layer.label) {
            // label id
            var id=feature.properties.layerName+'.'+shortname;

            // is there an existing label for this feature ?
            if ($scope.labels && $scope.labels[id]) {
              // reuse existing label
              layer.label=$scope.labels[id];

            } else {
              // create a new label
              $scope.labels[id] = layer.label = new L.Label({
                className: 'label-'+feature.properties.layerName
              }, layer);
              layer.label.setContent(shortname);
              // show label
              if ($scope.labels_visible) {
                $timeout(function(){
                  layer && layer._showLabel(feature.properties);
                },1);
              }
      		  }
          }
        }
      },

      updateSearchString: function updateSearchString(options) {
        var val=options.val;
        if (val!=$scope.searchString) {
          $scope.searchString=val;
          $scope.$emit('updateSearchString');
        }
      }, // onsearch

      getGeoJSONLayer: function getGeoJSONLayer(layerName) {
        var fg_layer;
        if ($scope.map) {
          $scope.map.eachLayer(function(lf_layer){
            if (!fg_layer &&
              lf_layer._layers &&
              lf_layer.options &&
              lf_layer.options.layerName==layerName
            ) {
              fg_layer=lf_layer;
              return false;
            }
          });
        }
        return fg_layer;

      }, // getGeoJSONLayer

      updateGeoJSON: function updateGeoJSON(layer) {
        // filter layer items according to searchString
        var rows=layer.data.rows||{};
        layer.rows=$scope.filterRows(rows,$scope.searchString);

        // get filtered geojson
        layer.geojson=beacons.toGeoJSON(layer);

        // get feature group layer
        var fg_layer=$scope.getGeoJSONLayer(layer.name);

        // layer displayed ?
        if (!fg_layer) {
          return;
        }

        // get feature names list and build features table indexed on feature name
        var features={};
        var featureNames=[];
        layer.geojson.features.forEach(function(feature){
          var name=feature.properties.description;
          featureNames.push(name);
          features[name]=feature;
        });

        // browse displayed features
        fg_layer.eachLayer(function(l){
          var hasMoved;
          var name=l.feature.properties.description;
          var fi=featureNames.indexOf(name);

          var latlng1;
          // feature must be displayed ?
          if (fi>=0) {
            // check if it did move
            var latlng0=l.feature.properties.latlng;
            latlng1=features[name].properties.latlng;
    //        console.log(latlng0,latlng1);
            hasMoved=latlng0.lat!=latlng1.lat || latlng0.lng!=latlng1.lng || latlng0[0]!=latlng1[0] || latlng0[1]!=latlng1[1];
          }

          // not to be displayed or moved ?
          if (fi<0 || hasMoved) {
            fg_layer.removeLayer(l);
            var labelId=l.feature.properties.layerName+'.'+name;
            if ($scope.labels[labelId]) {
              // not to be displayed ?
              // remove label as well
              if (fi<0) {
                $scope.map.removeLayer($scope.labels[labelId]);
                delete $scope.labels[labelId];
              } else {
                // move label
                if ($scope.labels[labelId].setLatLng) {
                  $scope.labels[labelId].setLatLng({
                    lat: latlng1.lat||latlng1[0]||0,
                    lng: latlng1.lng||latlng1[1]||0
                  });
                }
              }
            }

          } else {
            // already displayed and did not move,
            // we dont want to add it in the next loop
            featureNames.splice(fi,1);
          }
        });

        // add new or moved features
        if (featureNames.length) {
          layer.geojson.features.forEach(function(feature){
            if (featureNames.indexOf(feature.properties.description)>=0) {
              fg_layer.addData(feature);
            }
          });
        }

      }, // updateGeoJSON

      // return rows matching every substrings of searchString
      filterRows: function filterRows(rows,searchString){
        var result=[];
        var str=(searchString||'').toLowerCase().split(' ');

        rows.forEach(function(row, row_index){
          var mismatch=0;
          str.forEach(function(s){
            if (s.length) {
              ++mismatch;
              if (row.shortname.toLowerCase().match(s)) {
                --mismatch;
              }
            }
          });
          if (mismatch==0) {
            result.push(row);
          }
        });
        return result;

      }, // filterGeoJSON

      // hide unwanted controls
      updateControls: function updateControls(){
        $timeout(function(){
          var setDrawButtonsVisibility=$scope.drawOptions.enabled?'show':'hide';
          $('.leaflet-control.leaflet-draw')[setDrawButtonsVisibility](0);
          $('.fa-save').closest('.leaflet-control')[setDrawButtonsVisibility](0);

          var setAxisButtonsVisibility=$scope.axisButtonsVisible?'show':'hide';
          $('.fa-circle-o, .fa-dot-circle-o').closest('.leaflet-control')[setAxisButtonsVisibility](0);

        });
      }, // updateControls

      getLayerByName: function getLayerByName(layerName) {
        var layers=$scope.layers.baselayers;
        for (var name in layers) {
          if (layers[name] && layers[name].name==layerName) {
            return layers[name];
          }
        }
        layers=$scope.layers.overlays;
        for (var name in layers) {
          if (layers[name] && layers[name].name==layerName) {
            return layers[name];
          }
        }

      }, //getLayerByName

      getCurrentLayer: function getCurrentLayer(){
        if ($scope.currentLayer) {
          return $scope.currentLayer;
        } else {
          var baselayers=$scope.layers['baselayers']||$scope.__layers['baselayers'];
          for (var layerName in baselayers){
            if (baselayers[layerName].visible) {
              return baselayers[layerName];
            }
          }
        }
      }, // getCurrentLayer

      baselayerChange: function baselayerChange(e,data) {
        // store previous baselayer center and zoom
        $scope.getCurrentLayer().__center=angular.copy($scope.center);
        // the layer just displayed is now the current layer
        var layer=$scope.currentLayer=$scope.getLayerByName(data.leafletEvent.name);

        // update the CRS
        var crsName=layer.CRS||'EPSG900913';
        $scope.map.options.crs=L.CRS[crsName];

        var bounds;
        if (layer.type=='imageOverlay') {
          // hide minimap for indoor layers
          $('.leaflet-control-minimap, .leaflet-control-scale').hide(0);
          // "vanilla" bounds
          bounds=layer.bounds;
          $scope.coordsProjection='WGS84';

          // bring imageOverlay to back
          for (var id in $scope.map._layers) {
            if ($scope.map._layers[id]._url==layer.url) {
              $scope.map._layers[id].bringToBack();
            }
          }

        } else {
          // show minimap for outdoor layers
          $('.leaflet-control-minimap, .leaflet-control-scale').show(0);
          // get "vanilla" bounds
          bounds=[[layer.bounds.min.x,layer.bounds.min.y],[layer.bounds.max.x,layer.bounds.max.y]];
          $scope.coordsProjection='LV95';
        }
        // restore view parameters
        $scope.map.setMaxBounds(bounds);
        $scope.map._resetView(L.latLng(layer.__center.lat,layer.__center.lng),layer.__center.zoom||0);
        if (layer.__center.zoom===undefined) {
          // timeout needed for proper label positionning on first layer change after zoom
          $timeout(function(){
            $scope.map.fitBounds(bounds);
          },100);
        }

        // update beacons
        $scope.$emit('baseLayerChanged');

      }, // baselayerChange

      overlayChange: function overlayChange(e,data) {
        $scope.$emit('overlayChanged',e,data);
      },

      zoomEvent: function zoomEvent(e){
        $scope.$emit('zoomEvent',e);
      },

      init: function init(){
        var q=$q.defer();

        $scope.saveButton.disable();
        $scope.originButton.disable();
        $scope.axisButton.disable();

        $scope.beacons=beacons;
        $scope.$on('leafletDirectiveMap.lf-battelle.baselayerchange', $scope.baselayerChange);
        $scope.$on('leafletDirectiveMap.lf-battelle.overlayadd', $scope.overlayChange);
        $scope.$on('leafletDirectiveMap.lf-battelle.overlayremove', $scope.overlayChange);
        $scope.$on('leafletDirectiveMap.lf-battelle.zoomstart', $scope.zoomEvent);
        $scope.$on('leafletDirectiveMap.lf-battelle.zoomend', $scope.zoomEvent);

        $scope.loadLayers().then(function success(){
          $scope.setupEventHandlers();
          q.resolve();

        }, function error(err){
          q.reject(err);
        });

        return q.promise;

      } // init

    });

    $scope.init().then(function(){
      $scope.updateControls();

    });

  });
