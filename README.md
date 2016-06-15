# webmapp
webapp for web maps based on angularjs and ui-leaflet

## Status
Proof of concept

## Background
We began to develop an application aiming to display live map overlays for several pre-defined locations using [ui-leaflet] (https://github.com/angular-ui/ui-leaflet).

Layers must be defined in layers/layers.json (see below)

The base layers (satellite, plan, geojson) have to be available offline.

To generate the base layers from geolocated raster images we are using [ctb-tiles] (https://github.com/geo-data/cesium-terrain-builder) or [gdal2tiles] (http://www.gdal.org/gdal2tiles.html)

For indoor plans we only need an imageOverlay layers, using "Simple" CRS.

For the geojson overlays, when the data received from the url specified in layers.json needs pre-processing and/or when we need to refresh the data, we can define a scope.<className>.onload method (that should take care of generating the geojson if needed and setup the refresh loop) that will be called at initialization time. (see the "beacons.js" service in this example)

[Yeoman] (http://yeoman.io) [generator-angular] (https://github.com/yeoman/generator-angular) was choosed because it's brings in:
- a formatted collaborative environment
- powerful tools like bower, wiredep, sass, auto-prefixer, live-reload and more

Subsequently, [Strongloop] (http://www.strongloop.com) and the [loopback-sdk-angular] (https://github.com/strongloop/loopback-sdk-angular) could be used to generate a database abstraction layer (a HTTP REST API plus a javascript CRUD API available both server side and client side) and manage access control lists (ACL) 

Unfortunately the loopback cassandra connector at https://github.com/strongloop-community/loopback-connector-cassandra looks dead and is unusable at the time I'm writing this.

"Battelle.js" and "beacons.js" are named like this for historical reasons and it does not reflect the reality very well anymore since "layers.json" is now used to define and configure the available views or locations (base layers) and any type of geojson overlays could be displayed using "beacons.js"

An [angular directive] (https://docs.angularjs.org/guide/directive) will eventually emerge from the actual battelle.js view.


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
