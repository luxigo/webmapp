module.exports=(function(){

  // load cassandra driver
  const cassandra=require('cassandra-driver');

  // load cassandra client configuration
  const client_config=require('./cassandra-client-config.json');

  if (!client_config.enabled) {
    return {
      middleware: {
        find: function(req,res,next){
          res.statusCode=500;
          res.end("cassandra client disabled in cassandra-client-config.json !");
        }
      }
    }
  }

  // instantiate cassandra client
  const client = new cassandra.Client(client_config.config);

  // connect to database
  client.connect(function (err) {
    if (err) throw err;
  });

  /**
  @function find
   Get select
  @param callback {function} callback(err,result)
  @param req {object} request
  @param res {object} response
  @param next {function} next middleware
  */

  function find(callback,req,res,next){
    var model;
    var filter={
    };

    if (req.params) {
      model=req.params.model;
      if (req.params.filter) {
        filter=JSON.parse(req.params.filter)||{};
      }
    }

    if (!model || !model.match(/^[a-zA-Z0-9_\.]+$/)) {
      throw 'Invalid model name: '+model;
    }

    var fields=[];
    if (filter.fields) {
      if (Array.isArray(filter.fields)) {
        filter.fields.forEach(function(name){
          if (!name.match(/^[a-zA-Z0-9_]+$/)) {
            throw 'Invalid field name: '+name;
          }
          fields.push(name);
        });

      } else {
        var _filter_fields=filter.fields;
        for (name in _filter_fields) {
          if (_filter_fields.hasOwnProperty(name)){
            if (!name.match(/^[a-zA-Z0-9_]+$/)) {
              throw 'Invalid field name: '+name;
            }
            fields.push(name);
          }
        }
      }
    }

    if (!fields.length) {
      fields.push('*');
    }

    var query='SELECT '+fields.join(',')+' FROM '+model;
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
      find: _wrap(find)
    }

  }

})();
