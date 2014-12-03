var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var dataApi = require('../util/dataApi');
var Player = require('../domain/entity/player');
var User = require('../domain/user');
var consts = require('../consts/consts');
var async = require('async');
var utils = require('../util/utils');

var httpService = module.exports;

/**
 * Post an instance's all info
 * @param {json} state.
 * @param {function} cb Callback function.
 */
httpService.postInstanceInfo = function(instanceId,subDungeonId,invalid, cb){
    var query = {
        instanceId: instanceId,
        subDungeonId: subDungeonId,
        invalid: invalid
    };
    pomelo.app.get('httpclient').query('/get_instance_info', query, function (error, response, body) {
        if (error || response.statusCode != 200) {
            var err = error || new Error('statusCode: '+ response.statusCode);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null,body);
        }
    });
};

