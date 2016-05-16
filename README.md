# webmapp
webapp for web maps based on angularjs and ui-leaflet

## Status
Early development stage

## Background
We began to develop an application aiming to display live map overlays for several pre-defined locations.

The base layers (sattelite, plan, geojson) have to be available offline.

To generate the base layers we are using ctb-tiles or gdal2tiles with geolocated raster images or vector data.

To get live information from the servers we can use long polls, server events or socktetio.

An angular directive will eventually emerge from the actual view.

Yeoman angular-generator was choosed because it's brings in:
- a formatted collaborative environment
- powerful tools like bower, wiredep, sass, auto-prefixer, live-reload and more

To start we are simply gonna fetch a json file from the server to update the overlays. 

Subsequently, Strongloop and the loopback-sdk-angular could be used to generate a database abstraction layer (a HTTP REST API plus a javascript CRUD API available both server side and client side) and manage access control lists (ACL) 

## Installation
```
git clone https://github.com/luxigo/webmapp
```

The application html root is located in webmapp/dist.

The layers directory (currently omitted) is webmapp/app/layers and should be copied in webmapp/dist/layers

Actually the application main view is "app/views/battelle" which is looking for 'layers/battelle/layers.json'

The actual layers.json file format is:
```
{ 
  "layer_name": {
    "description": "layer name",
    "baseLayer": <boolean>,
    "visible": <boolean>,
    "type": <leaflet-layer-type>,  // eg "xyz" or "geoJSONShape"
    "url": <url>, // according to leaflet layer type
    "projection": <proj4-projection-type>, // eg "WGS84"
    "center": <coordinates-array>, // expressed in proj4-projection-type
    "options": <leaflet-layer-options>
    },
    ...
}
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
