module.exports=(function(){

  // load cassandra driver
  const cassandra=require('cassandra-driver');

  // load cassandra client configuration
  const config=require('./cassandra-client-config.json');

  // instantiate cassandra client
  const client = new cassandra.Client(config);

  // connect to database
  client.connect(function (err) {
    if (err) throw err;
  });

  /**
  @function getBeacons
   Get beacons list
  @param callback {function} callback(err,result)
  @param req {object} request
  @param res {object} response
  @param next {function} next middleware
  */
  function getBeacons(callback,req,res,next){
    var query='SELECT shortname,x,y FROM repoble.currentxy';
    console.log(req.params);
    if (req.params && req.params.filter && req.params.filter.match(/^[a-zA-Z0-9]+$/)) {
      query+=" WHERE shortname CONTAINS '"+req.params.contains+"'"
      + " ALLOW FILTERING"
      + ";";
    } else {
      query+=';';
    }
    client.execute(query,callback);
  }


  /**
  @function params
    Get http request params
  @param req {object} request
  */
  function params(req) {
    if (!req.params) {
      req.params={};
      req.url.replace(/[^\?]+\??/,'').split('&').forEach(function(str){
        var pos=str.search('=');
        if (pos>0) {
          req.params[decodeURIComponent(str.substr(0,pos))]=decodeURIComponent(str.substr(pos+1));
        }
      });
    }
  }

  /**
  @function _wrap
    Wrap middleware method's callback to convert result to json
    and to return json with error property set in case of failure
  @param method {function} method(callback,req,res,next)
  */
  function _wrap(method) {
    return function(req,res,next){

      // method's callback wrapper
      function callback(err,result){
        if (err) {
          res.end(JSON.stringify({
            error: err.toString()
          }));
        } else {
          res.end(JSON.stringify(result,null,4));
        }
      }

      try {
        params(req);
        method(callback,req,res,next);

      } catch(err) {
        res.end(JSON.stringify({
          error: err.toString()
        }));
      }
    }
  }

  // module exports
  return {
    middleware: {
      beacons: _wrap(getBeacons)
    }

  }

})();
