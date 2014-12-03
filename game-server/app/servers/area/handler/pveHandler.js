/**
 * Module dependencies
 */
var messageService = require('../../../domain/messageService');
var areaService = require('../../../services/areaService');
var userDao = require('../../../dao/userDao');
var Move = require('../../../domain/action/move');
var actionManager = require('../../../domain/action/actionManager');
var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var consts = require('../../../consts/consts');
var dataApi = require('../../../util/dataApi');
var channelUtil = require('../../../util/channelUtil');
var utils = require('../../../util/utils');
var Player = require('../../../domain/entity/player');
var httpService = require('../../../services/httpService');

var handler = module.exports;



handler.pveDamage = function(msg, session, next) {
    //var player = session.area.getPlayer(msg.playerId);
    var area = session.area;
    var damage = msg.damage;
    var playerId = msg.playerId;
    //area.addDamage(playerId,damage);

    var length = damage.length;
    for(var i = 0; i < length; ++i) {
        var attacker = damage[i].attacker;
        var defender = damage[i].defender;
        var value = damage[i].value;
        area.addDamage(attacker, defender, value);
    }

    next();

    var attackCache = {};
    var damageCache = {};
    for(var i = 0; i < length; ++i) {
        var attacker = damage[i].attacker;
        var defender = damage[i].defender;
        if(attacker > 0 && !attackCache[attacker]) {
            attackCache[attacker] = area.attackCache[attacker];
        }
        if(defender > 0 && !damageCache[defender]) {
            damageCache[defender] = area.damageCache[defender];
        }
    }

    var msg = {
        route : 'onPveDamage',
        playerId : playerId,
        attack: attackCache,
        damage: damageCache
    };

    area.getChannel().pushMessage(msg);
};


handler.nextSubDungeon = function(msg, session, next) {
    var area = session.area;

    next();

    area.subDungeonId = msg.subDungeonId;
    httpService.postInstanceInfo(area.instanceId,area.subDungeonId,true,function(err,result) {
        if (err) {
            utils.myPrint("postInstanceInfo: result = ", err.stack);
        } else {
            utils.myPrint("postInstanceInfo: result = ture");
        }
    })

    var msg = {
        route : 'onNextSubDungeon',
        playerId : msg.playerId,
        portalName : msg.portalName,
        subDungeonId : msg.subDungeonId
    };

    area.getChannel().pushMessage(msg);
};
