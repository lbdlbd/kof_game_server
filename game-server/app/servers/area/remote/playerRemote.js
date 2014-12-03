/**
 * Module dependencies
 */

var utils = require('../../../util/utils');
/*var userDao = require('../../../dao/userDao');
var bagDao = require('../../../dao/bagDao');
var taskDao = require('../../../dao/taskDao');
var equipmentsDao = require('../../../dao/equipmentsDao');*/
var consts = require('../../../consts/consts');
var areaService = require('../../../services/areaService');
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var messageService = require('../../../domain/messageService');

var exp = module.exports;

/**
 * Player exits. It will persistent player's state in the database.
 *
 * @param {Object} args
 * @param {Function} cb
 * @api public
 */
exp.playerLeave = function(args, cb){
  var playerId = args.playerId;
  var area = pomelo.app.areaManager.getArea(args.instanceId);
  var player = area.getPlayer(playerId);

  utils.myPrint('1 ~ areaId = ', area.areaId);
  utils.myPrint('2 ~ instanceId = ', args.instanceId);
  utils.myPrint('3 ~ args = ', JSON.stringify(args));
  if(!player){
    logger.warn('player not in the area ! %j', args);
    return;
  }
  var sceneId = player.areaId;

  if(!player) {
    utils.invokeCallback(cb);
    return;
  }

/*  var params = {playerId: playerId, teamId: player.teamId};
  pomelo.app.rpc.manager.teamRemote.leaveTeamById(null, params,
    function(err, ret) {
    });*/

  if(player.hp === 0){
    player.hp = Math.floor(player.maxHp/2);
  }

  //If player is in a instance, move to the scene
  if(area.type !== consts.AreaType.SCENE){
    var pos = areaService.getBornPoint(sceneId);
    player.x = pos.x;
    player.y = pos.y;
  }

  area.removePlayer(playerId);
  area.channel.pushMessage({route: 'onUserLeave', code: consts.MESSAGE.RES, playerId: playerId});
  utils.invokeCallback(cb);
};


