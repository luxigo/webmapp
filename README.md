# webmapp
webapp for web maps based on angularjs and ui-leaflet

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

## Installation
```
git clone https://github.com/luxigo/webmapp
cd webmapp
npm install
bower install
```

## Build & development
```
grunt --force
grunt serve
```

## YO

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

Run `grunt` for building and `grunt serve` for preview.

Running `grunt test` will run the unit tests with karma.
