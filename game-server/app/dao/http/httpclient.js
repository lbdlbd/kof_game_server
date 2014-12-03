var request = require('request');
var querystring = require('querystring');
var logger = require('pomelo-logger').getLogger(__filename);

var httpclient = module.exports;

var url = '';

/**
 * init httpclient
 */
httpclient.init = function(app) {
    var httpConfig = app.get('http');
    
    if(httpConfig.port){
        url = 'http://' + httpConfig.host + ':' + httpConfig.port;
    } else {
        url = 'http://' + httpConfig.host;
    }

    return httpclient;
};

httpclient.query = function(pathname, query, cb) {
    if (query && typeof query === 'object' &&
        Object.keys(query).length) {
        query = querystring.stringify(query);
    }
    var search = (query && ('?' + query)) || '';
    var href = url + pathname + search;

    request(href, cb);
};


