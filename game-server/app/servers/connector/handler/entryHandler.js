var userDao = require('../../../dao/userDao');
var async = require('async');
var logger = require('pomelo-logger').getLogger(__filename);
var channelUtil = require('../../../util/channelUtil');
var utils = require('../../../util/utils');
var Code = require('../../../../../shared/code');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

var PlayerId = 100;  //从数据库中读取，暂时用这个生成不重复的playerId

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.entry = function(msg, session, next) {
	/*next(null, {code: 200, msg: 'game server is ok.'});
	return;*/
	/*var token = msg.token, self = this;

	if(!token) {
		next(new Error('invalid entry request: empty token'), {code: Code.FAIL});
		return;
	}*/

	var self = this;
	var uid = msg.uid;
	var rid = msg.rid;
  //var kindId = msg.kindId;
	/*var player = {
	  id : PlayerId++,
	  userId : '0',
	  kindId : '0002',
	  name : '',
	  country : '0',
	  rank : 'dfsfds',
	  level : '1',
	  experience : '0',
	  attackValue : '0',
	  defenceValue : '0',
	  hitRate : '0',
	  dodgeRate : '0',
	  walkSpeed : '0',
	  attackSpeed : '0',
	  hp : '0',
	  mp : '0',
	  maxHp : '0',
	  maxMp : '0',
	  areaId : '1',
	  x : '0',
	  y : '0',
	  kindName : 'god soilder',
	  skillPoint : '0'
	};

  player.name = uid + "(name)";
	player.userId = uid;  //暂时用*/

  var players;
	async.waterfall([
    function(cb) {
      //userDao.getPlayersByUid(uid, cb);
      var token = {playerId: msg.playerId, sessionId: msg.sessionId};
      userDao.getPlayersByToken(token, cb);
    },
    function(res, cb) {
      players = res;
			self.app.get('sessionService').kick(uid, cb);
		}, function(cb) {
			session.bind(uid, cb);
		}, function(cb) {
      if(!players || players.length === 0) {
        next(null, {code: Code.OK});
        return;
      }
      player = players[0];
			session.set('serverId', self.app.get('areaIdMap')[player.areaId]);
      session.set('userId', player.userId);
      session.set('playername', player.name);
			session.set('playerId', player.id);
			session.set('rid', rid); //add
      //session.set('kindId',kindId);
			session.on('closed', onUserLeave.bind(null, self.app));
			session.pushAll(cb);
		}, function(cb) {
			self.app.rpc.chat.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, cb.bind(self,null));
		}
	], function(err, users) {
		if(err) {
			next(err, {code: Code.FAIL});
			return;
		}
		next(null, {users: users, player: player});
    //next(null, {code: 200, msg: 'game server is ok.'});
		//next(null, {code: Code.OK, player: players ? players[0] : null});
	});
  //next(null, {code: 200, msg: 'game server is ok.'});
};

Handler.prototype.enter = function(msg, session, next) {
	var self = this;
	var rid = msg.rid;
	//var uid = msg.username + '*' + rid
	var uid = msg.username;
	var sessionService = self.app.get('sessionService');

	//duplicate log in
	if( !! sessionService.getByUid(uid)) {
		next(null, {
			code: 500,
			error: true
		});
		return;
	}

	session.bind(uid);
	session.set('rid', rid);
	session.push('rid', function(err) {
		if(err) {
			console.error('set rid for session service failed! error is : %j', err.stack);
		}
	});
	session.on('closed', onUserLeave.bind(null, self.app));

	//put user into channel
	self.app.rpc.chat.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
		next(null, {
			users:users
		});
	});
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
    if(!session || !session.uid) {
        return;
    }
    utils.myPrint('1 ~ OnUserLeave is running ...');
    app.rpc.area.playerRemote.playerLeave(session, {playerId: session.get('playerId'), instanceId: session.get('instanceId')}, function(err){
        if(!!err){
            logger.error('user leave error! %j', err);
        }
    });
    //app.rpc.chat.chatRemote.kick(session, session.uid, null);
	  app.rpc.chat.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);
};