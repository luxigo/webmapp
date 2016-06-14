# webmapp
webapp for web maps based on angularjs and ui-leaflet

## Status
Early development stage

## Background
We began to develop an application aiming to display live map overlays for several pre-defined locations using [ui-leaflet] (https://github.com/angular-ui/ui-leaflet).

The base layers (sattelite, plan, geojson) have to be available offline.

To generate the base layers we are using [ctb-tiles] (https://github.com/geo-data/cesium-terrain-builder) or [gdal2tiles] (http://www.gdal.org/gdal2tiles.html) with geolocated raster images or vector data.

To get live information from the servers we can use long polls, server events or socktetio.

[Yeoman] (http://yeoman.io) [generator-angular] (https://github.com/yeoman/generator-angular) was choosed because it's brings in:
- a formatted collaborative environment
- powerful tools like bower, wiredep, sass, auto-prefixer, live-reload and more

To start we are simply fetching a json file repeatedly from the server to update the overlays. 

Subsequently, [Strongloop] (http://www.strongloop.com) and the [loopback-sdk-angular] (https://github.com/strongloop/loopback-sdk-angular) could be used to generate a database abstraction layer (a HTTP REST API plus a javascript CRUD API available both server side and client side) and manage access control lists (ACL) 

An [angular directive] (https://docs.angularjs.org/guide/directive) will eventually emerge from the actual view, and a (dynamic) json resource could be used to define and configure the available views.


# Installation
```
git clone https://github.com/luxigo/webmapp
```

The application html root is located in webmapp/dist.

The layers directory (currently omitted) is webmapp/app/layers and should be copied in webmapp/dist/layers

Actually the application main view is "app/views/battelle" which is looking for 'layers/battelle/layers.json'

Baselayers examples:
```
{ 
  "layer_name": {
    "description": "layer name",
    "baseLayer": <boolean>,
    "visible": <boolean>,
    "type": <leaflet-layer-type>,  // eg "xyz", "geoJSONShape" or "imageOverlay"
    "CRS": <crs>, // eg: "Simple" for imageOverlays
    "url": <url>, // according to leaflet layer type
    "projection": <proj4-projection-type>, // eg "WGS84"
    "center": <coordinates-array>, // expressed in proj4-projection-type (pixel coordinates for imageOverlay)
    "bounds": [ <coordinates-array>, <coordinates-array> ], // expressed in proj4-projection-type (pixel coordinates for imageOverlay)
    "options": <leaflet-layer-options>
    },
    ...
}
```
Dynamic geojson overlay example:

```
    "beacons": {
      "description": "Beacons, filtered",
      "baseLayer": false,
      "visible": true,
      "type": "geoJSONShape",
      "projection": "WGS84",
      "url": "/cassandra/find?model=repoble.currentxy&filter={\"fields\": [\"shortname\",\"x\",\"y\"]}",
      "refresh": "1000",
      "class": "beacons", // triggers $scope.beacons.onload
      "localsystem": {
        "photo": {
          "proj": "EPSG:2056",
          "origin": [ 2499670.90206156, 1114753.42399633 ],
          "downVector": [ 2499680.14609066, 1114764.71805181 ]
        },
        "biblio": {
          "switchAxis": true, // downVector is now "rightVector"...
          "invertXAxis": false,
          "invertYAxis": false,
          "origin": [-424, 418],
          "downVector": [643, 419],
          "downVectorLength": 18
        }
      },
      "options": {
        "style": {
          "fillColor": "yellow",
          "weight": 2,
          "opacity": 1,
          "color": "blue",
          "dashArray": 3,
          "fillOpacity": 0.7
        }
      }
    },
    ```
  
  
# Development

## Prerequisite

* node > 4.4.0

I recommend you install node via nvm which allow upgrading and switching versions easily:
  https://github.com/creationix/nvm
```
nvm install v4
```

* npm > 3.0
```
npm install -g npm
```

* compass and sass
``` 
sudo apt-get install ruby-compass 
sudo gem install compass
```

* Other required packages
```
npm install -g yo generator-angular grunt grunt-cli grunt-karma bower
```

## Install dependencies
```
cd webmapp
npm install
bower install
```

## Build, serve and reload
```
grunt --force watch
grunt serve
```

# YO

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

Run `grunt` for building and `grunt serve` for preview.

Running `grunt test` will run the unit tests with karma.
