var crc = require('crc');
var logger = require('pomelo-logger').getLogger(__filename);

module.exports.dispatch = function(uid, connectors) {
	//var index = Number(uid) % connectors.length;
  var index = Math.abs(crc.crc32(uid)) % connectors.length;
	return connectors[index];
};
