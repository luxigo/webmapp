"use strict";angular.module("webmappApp",["ngAnimate","ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui-leaflet"]).config(["$routeProvider",function($routeProvider){$routeProvider.when("/Battelle",{templateUrl:"views/battelle.html",controller:"BattelleCtrl",controllerAs:"battelle"}).otherwise({redirectTo:"/Battelle"})}]),proj4.defs("EPSG:2056","+title=LV95 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"),proj4.defs("LV95","+title=LV95 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"),proj4.defs("MN95","+title=MN95 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"),proj4.defs("CH1903+_LV95","+title=MN95 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"),angular.module("webmappApp").controller("MainCtrl",function(){this.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"]}),angular.module("webmappApp").controller("AboutCtrl",function(){this.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"]}),angular.module("webmappApp").controller("BattelleCtrl",["$scope","$http","$location","$timeout","notify","leafletData","leafletDrawEvents","$q",function($scope,$http,$location,$timeout,notify,leafletData,leafletDrawEvents,$q){this.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"],$timeout(function(){$scope.map=leafletData.getMap(),$scope.map.then(function(map){$scope.map=map})},1e3),$scope.center={lng:6,lat:46,zoom:8},$scope.drawnItems=new L.FeatureGroup,angular.extend($scope,{center:{lng:8,lat:47,zoom:8},layers:{},loadLayers:function(url){var scope=this,q=$q.defer();return scope.json?q.resolve():(url=url||"layers/battelle/layers.json",$http.get(url).then(function(res){200!=res.status?(notify.message('Could not load layers from "'+url+'".'),q.reject()):$scope.initLayers(res).then(q.resolve)})),q.promise},initLayers:function(res){function doneOne(){--todo,todo||q.resolve()}var center,pathname=res.config.url.replace(/layers\.json.*/,""),layers={},todo=0;angular.forEach(res.data,function(layer,layerName){++todo});var q=$q.defer();return angular.forEach(res.data,function(layer,layerName){var layerClass;if(layer.baseLayer){if(layerClass="baselayers",!center&&layer.visible){var coords=proj4(layer.projection,"WGS84",layer.center);center={lng:coords[0],lat:coords[1],zoom:void 0!==layer.options.minZoom?Math.floor(layer.options.minZoom+(layer.options.maxZoom-layer.options.minZoom)/3):8}}}else layerClass="overlays";var list=layers[layerClass];list||(list=layers[layerClass]={}),"geoJSONShape"==layer.type?$http.get(pathname+layer.url).then(function(res){list[layerName]={name:layer.description||layerName,type:layer.type,data:res.data,visible:layer.visible||!1,layerParams:layer.options||{}},doneOne()}):(list[layerName]={name:layer.description||layerName,url:pathname+layer.url,type:layer.type,visible:layer.visible||!1,layerParams:layer.options||{}},doneOne())}),q.promise.then(function(){angular.extend($scope,{center:center||$scope.center,layers:layers||$scope.layers})}),q.promise},controls:{scale:{imperial:!1},minimap:{type:"minimap",layer:{name:"OpenStreetMap",url:"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",type:"xyz"},toggleDisplay:!0},custom:[L.control.locate({follow:!0}),L.easyButton("fa-crosshairs fa-lg",function(btn,map){var hair=$(".hair");hair.is(":visible")?(hair.hide(0),$("#mousecoords").hide(),$scope.hairVisible=!1):(hair.show(0),$("#mousecoords").show(),$scope.hairVisible=!0)})]},drawOptions:{draw:{polyline:{metric:!1},polygon:{metric:!1,showArea:!0,drawError:{color:"#b00b00",timeout:1e3},shapeOptions:{color:"blue"}},circle:{showArea:!0,metric:!1,shapeOptions:{color:"#662d91"}},marker:!1},edit:{featureGroup:$scope.drawnItems,remove:!0}},drawEventHandlers:{created:function(e,leafletEvent,leafletObject,model,modelName){$scope.drawnItems.addLayer(leafletEvent.layer),console.log("created",arguments),console.log(JSON.stringify(leafletEvent.layer.toGeoJSON(),null,4)),console.log($scope.drawnItems)},edited:function(arg){console.log(arguments)},deleted:function(arg){var layers;layers=arg.layers,$scope.drawnItems.removeLayer(layer)},drawstart:function(arg){},drawstop:function(arg){},editstart:function(arg){},editstop:function(arg){},deletestart:function(arg){},deletestop:function(arg){}},events:{map:{enable:["mousemove","mousedown","move","moveend"],logic:"emit"}},mouseCoords:{LV95:[0,0],WGS84:[0,0]},centerCoords:{LV95:[0,0],WGS84:[0,0]},coordsToDisplay:"centerCoords",coordsProjection:"LV95",getCoordsToDisplay:function(){var scope=this,coords=scope.coordsToDisplay&&scope[scope.coordsToDisplay]&&scope[scope.coordsToDisplay][scope.coordsProjection];return coords?coords[0].toFixed(8)+", "+coords[1].toFixed(8):"not available"},getCenter:function(){var scope=this;if(scope.map){var coords=scope.map.getCenter();scope.centerCoords.WGS84=[coords.lng,coords.lat],scope.centerCoords.LV95=proj4("WGS84","EPSG:2056",[coords.lng,coords.lat])}return scope.centerCoords},getMouseCoords:function(leafletMouseEvent){var scope=this,coords=(leafletMouseEvent||scope.leafletMouseEvent).latlng;return scope.mouseCoords.WGS84=[coords.lng,coords.lat],scope.mouseCoords.LV95=proj4("WGS84","EPSG:2056",[coords.lng,coords.lat]),scope.mouseCoords},setupEventHandlers:function(){var scope=this;scope.$on("leafletDirectiveMap.lf-battelle.mousemove",function(event,args){scope.leafletEvent=args.leafletEvent}),scope.$on("leafletDirectiveMap.lf-battelle.move",function(event,args){scope.getCenter()});var drawEvents=leafletDrawEvents.getAvailableEvents();angular.forEach(scope.drawEventHandlers,function(handler,eventName){eventName="draw:"+eventName;var idx=drawEvents.indexOf(eventName);0>idx?console.log("Error: unknown drawEvent "+eventName):drawEvents.splice(idx,1),scope.$on("leafletDirectiveDraw.lf-battelle."+eventName,function(e,payload){var p=payload;handler(e,p.leafletEvent,p.leafletObject,p.model,p.modelName)})}),drawEvents.length&&console.log("warning: no handlers for the following drawEvents:",drawEvents),scope.$on("centerUrlHash",function(event,centerHash){scope.centerHash=centerHash})},init:function(){var q=$q.defer();return $scope.loadLayers().then(function(){$scope.setupEventHandlers(),q.resolve()},function(err){q.reject(err)}),q.promise}}),$scope.geojson={style:{fillColor:"green",weight:2,opacity:1,color:"white",dashArray:"3",fillOpacity:.7}},$scope.init().then(function(){function iter(){var q=$q.defer();return $http.get("layers/battelle/live.geojson?"+Date.now()).then(function(res){console.log(res.data),q.resolve(res.data)},function(res){console.log(res),q.reject(new Error("Could not load layers/battelle/live.geojson"))}),q.promise}function loop(){iter().then(function(data){$scope.geojson.data=data,$timeout(function(){loop()},12e5)},function(err){notify.message(err.message),$timeout(function(){loop()},5e3)})}loop()})}]),angular.module("webmappApp").service("notify",function(){this.message=function(message){$.notify({message:'<span class="fa fa-exclamation-triangle">&nbsp;</span>'+message},{delay:5e3})}}),angular.module("webmappApp").run(["$templateCache",function($templateCache){$templateCache.put("views/about.html","<p>This is the about view.</p>"),$templateCache.put("views/battelle.html",'<div id="battelle" ng-cloak> <div id="crosshair-h" class="hair"></div> <div id="crosshair-v" class="hair"></div> <leaflet ng-if="layers.overlays" geojson="geojson" id="lf-battelle" lf-center="center" layers="layers" controls lf-draw="drawOptions" event-broadcast="events" url-hash-center="yes" width="100%" height="100%"></leaflet> <div class="wrapper"> <div id="mousecoords" ng-cloak>{{getCoordsToDisplay()}}</div> </div> </div>'),$templateCache.put("views/main.html","")}]);