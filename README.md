# graylog-loging
This is a node js loging middleware for graylog. It has been designed for request, response and error loging.

## What is GrayLog
GrayLog is an open source log management application. See details https://www.graylog.org/

## Installation
```
  npm install graylog-loging --save
```

## Usage
If you want to set your graylog server host informations, you need to init graylog-loging module in your server.js file.

```
var graylog = require('graylog-loging');
graylog.init({
  graylogPort: 12201,
  graylogHostname: '192.168.1.5'
});
```
### Init Options
Here is the default values for graylog-loging options. You can set this options on init.
```
  var options = {
    graylogPort : 12201, //Graylog Server Port
    graylogHostname : '127.0.0.1', //Graylog Server Host
    connection: 'wan', //Graylog Server Connection,
    maxChunkSizeWan : 1420,
    maxChunkSizeLan : 8154,
    logRequest : true, //If setted false, it's not log request logs
    requestLogLevel : 'info', //Log level for request logs
    logResponse : true, //If setted false, it's not log response logs
    responseLogLevel : 'info', //Log level for response logs
    environment : 'live', //You can set your environmen like development, prelive or etc
    applicationName : 'default', //You can set your application name like authentication-api
    enableUncaughtException : true //It will log your uncaught exceptions
  };
```

### Log Request
You can set your request log in server.js for whole application. But it will **not** log your _query_ and _params_ parameters in request.
```
app.use(graylog.logRequest);
```
If you want to catch your _params_ and _query_ paramters please set request log in your route level.
```
app.get('/my-route', graylog.logRequest,function(req, res, next){
  //Your-code-here
});
```

It will log;
- authorization : _Authorization header_
- body : _Request body_
- environment : _live, prelive, development or whatever you set on init config_
- facility : 'node.js'
- ip : _ip address_
- log-level : 'info'
- message : 'Request for /my-route'
- method : 'GET|POST|PUT|DELETE' etc.
- pair-id : _Unique id for request_
- params : _Params object_
- query : _Query object_
- source : _application name which you set on init config_
- timestamp : '2017-04-19T10:02:51.535Z'
- type : 'request' _It describes log type_
- url : 'Request url address'
- user-agent : 'Mozilla/5.0 ....'

### Log Response
It designed for log your response message. You can set it on your server.js file.
```
app.use(log.logResponse);
```
It will log;
- body : _Response body_
- environment : _live, prelive, development or whatever you set on init config_
- facility : 'node.js'
- log-level : 'info'
- message : "Response log for '/my-route'"
- method : 'GET|POST|PUT|DELETE' etc.
- pair-id : _Unique id for request_
- source : _application name which you set on init config_
- statusCode : _Response status code_
- timestamp : 2017-04-19T08:31:39.667Z
- type : 'response' _It describes log type_

### Handle Errors
You can set this middleware after you set your routes. It will catch express errors and create log.
```
app.use(log.handleErrors);
```
It will log;
  - environment : _live, prelive, development or whatever you set on init config_
  - error : _Error stack_
  - facility : 'node.js'
  - log-level : 'error'
  - message : "Error log for '/my-route'"
  - method : 'GET|POST|PUT|DELETE' etc.
  - pair-id : _Unique id for request_
  - source : _application name which you set on init config_
  - timestamp : 2017-04-19T08:31:39.667Z
  - type : 'error-handler' _It describes log type_
  
### Uncaught Exception Loging
It has been designed for creating logs on your node application crashes. If you don't want to use Uncaught Exception Loging, you can set _enableUncaughtException : false_ in your init config.
```
graylog.init({
  enableUncaughtException : false
});
```

## What Is Pair Id?
It's a unique timestamp that creating on request loging. So you can see which response log belongs to request log. They have the same pair-id. When you search pair id in your graylog client application, you can see reqest log and response log for a client request/response proccess.

## License

MIT

## Author

Melih Korkmaz <melih@tdsmaker.com>.