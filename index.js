var mung = require('express-mung');
var Gelf = require('gelf');
var _config = {
    logRequest : true,
    requestLogLevel : "info",
    logResponse : true,
    responseLogLevel : "info",
    environment : "live",
    applicationName : "default",
    logAccountId : false,
    enableUncaughtException : true
};

var _grayLogConfig = {
    graylogPort: 12201,
    graylogHostname: '127.0.0.1',
    connection: 'wan',
    maxChunkSizeWan: 1420,
    maxChunkSizeLan: 8154
};

var gelf = new Gelf(_grayLogConfig);


module.exports.init = function(config){
    if(config === undefined){
        throw new Error('config is missing');
    }

    _grayLogConfig.graylogPort      = config.graylogPort             || _grayLogConfig.graylogPort;
    _grayLogConfig.graylogHostname  = config.graylogHostname         || _grayLogConfig.graylogHostname;
    _grayLogConfig.connection       = config.connection              || _grayLogConfig.connection;
    _grayLogConfig.maxChunkSizeWan  = config.maxChunkSizeWan         || _grayLogConfig.maxChunkSizeWan;
    _grayLogConfig.maxChunkSizeLan  = config.maxChunkSizeLan         || _grayLogConfig.maxChunkSizeLan;

    _config.logRequest              = config.logRequest              || _config.logRequest;
    _config.requestLogLevel         = config.requestLogLevel         || _config.requestLogLevel;
    _config.logResponse             = config.logResponse             || _config.logResponse;
    _config.responseLogLevel        = config.responseLogLevel        || _config.responseLogLevel;
    _config.environment             = config.environment             || _config.environment;
    _config.applicationName         = config.applicationName         || _config.applicationName;
    _config.logAccountId            = config.logAccountId            || _config.logAccountId;
    _config.enableUncaughtException = config.enableUncaughtException || _config.enableUncaughtException
    gelf = new Gelf(_grayLogConfig);
};

module.exports.logRequest = function(req, res, next){
    if(!_config.logRequest) {
        next();
        return;
    }

    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;

    var ip = ip.replace('::ffff:', '');

    var message = {
        "version": "1.1",
        "ip" : ip,
        "environment" : _config.environment,
        "host": _config.applicationName,
        "short_message": "Request log for '" + req.originalUrl + "'",
        "log-level": _config.requestLogLevel,
        "user-agent" : req.headers['user-agent'],
        "origin" : req.headers['origin'],
        "authorization" : req.headers['authorization'],
        "url" : req.originalUrl,
        "method" : req.method,
        "params" : req.params,
        "query" : req.query,
        "body" : req.body,
        "pair-id" : new Date().getTime(),
        "type" : "request"
    };
    
    if(req.user !== undefined)
        message['user-id'] = req.user._id || req.user.id;

    if(_config.logAccountId && req.user !== undefined)
        message['account-id'] = req.user.accountId

    gelf.emit('gelf.log', message);
    
    req.pairId = message["pair-id"];
    next();
};

module.exports.logResponse = mung.json(function(body, req, res){
    if(!_config.logResponse) {
        next();
        return;
    }

    var message = {
        "version": "1.1",
        "environment" : _config.environment,
        "short_message": "Response log for '" + req.originalUrl + "'",
        "body" : body,
        "log-level": _config.responseLogLevel,
        "host": _config.applicationName,
        "method" : req.method,
        "pair-id" : req.pairId,
        "type" : "response",
        "statusCode" : res.statusCode
    };

    gelf.emit('gelf.log', message);

    return body;
}, { mungError : true});

module.exports.handleErrors = function(err, req, res, next){

  var message = {
    "version": "1.1",
    "environment" : _config.environment,
    "short_message": "Error log for '" + req.originalUrl + "'",
    "error" : err.stack,
    "log-level": "error",
    "host": _config.applicationName,
    "method" : req.method,
    "pair-id" : req.pairId,
    "type" : "error-handler"
  };

  gelf.emit('gelf.log', message);

  return res.status(500).send('Unknown Error:' + err.message);
};

module.exports.log = function(level, params){
    if(params === undefined || level === undefined) return;

    var userMessage = {};

    if(typeof params === "object")
        userMessage = params;
    else
        userMessage.short_message = params;

    delete userMessage['log-level'];

    var message = {
        "version": "1.1",
        "environment" : _config.environment,
        "host": _config.applicationName,
        "log-level": level,
        "type" : "application-log"
    };

    for(var propertyName in userMessage)
        message[propertyName] = userMessage[propertyName];

    gelf.emit('gelf.log', message);
};

module.exports.info = function(params){
    module.exports.log('info', params);
};

module.exports.warn = function(params){
    module.exports.log('warn', params);
};

module.exports.error = function(params){
    module.exports.log('warn', params);
};

module.exports.verbose = function(params){
    module.exports.log('verbose', params);
};

module.exports.debug = function(params){
    module.exports.log('debug', params);
};


//Private Functions
process.on('uncaughtException', function (err) {
    if(_config.enableUncaughtException){
        var message = {
            "version": "1.1",
            "environment" : _config.environment,
            "short_message": "Critical Error!",
            "error" : err.stack,
            "log-level": "critical",
            "host": _config.applicationName,
            "type" : "uncaught-exception"
        };

        gelf.emit('gelf.log', message);
        
        
    }

    setTimeout(function(){
        console.log(err.stack);
        process.exit(1)
    });

});