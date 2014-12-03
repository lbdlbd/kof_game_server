var pomelo = require('pomelo');
var areaService = require('./app/services/areaService');
var instanceManager = require('./app/services/instanceManager');
var scene = require('./app/domain/area/scene');
var instancePool = require('./app/domain/area/instancePool');
var dataApi = require('./app/util/dataApi');
var routeUtil = require('./app/util/routeUtil');
var playerFilter = require('./app/servers/area/filter/playerFilter');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'kof');

// configure for global
app.configure('production|development', function() {
    //app.enable('systemMonitor');
    //Set areasIdMap, a map from area id to serverId.
	if (app.serverType !== 'master') {
		var areas = app.get('servers').area;
		var areaIdMap = {};
		for(var id in areas){
			areaIdMap[areas[id].area] = areas[id].id;
		}
		app.set('areaIdMap', areaIdMap);

    // route configures
    app.route('area', routeUtil.area);
    app.route('connector', routeUtil.connector);

    app.loadConfig('http', app.getBase() + '/config/http.json');

    app.filter(pomelo.filters.timeout());
	}

});

// app configuration
app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true,
      setNoDelay : true
    });
});

app.configure('production|development', 'gate', function(){
    app.set('connectorConfig',
        {
            connector : pomelo.connectors.hybridconnector,
            useProtobuf : true
        });
});

// Configure for area server
app.configure('production|development', 'area', function(){
  app.filter(pomelo.filters.serial());
  app.before(playerFilter());

  //Load scene server and instance server
  var server = app.curServer;
  if(server.instance){
    instancePool.init(require('./config/instance.json'));
    app.areaManager = instancePool;
  }else{
    scene.init(dataApi.area.findById(server.area));
    app.areaManager = scene;
  }

  //Init areaService
  areaService.init();
});

app.configure('production|development', 'manager', function(){
    var events = pomelo.events;

    app.event.on(events.ADD_SERVERS, instanceManager.addServers);

    app.event.on(events.REMOVE_SERVERS, instanceManager.removeServers);
});

// Configure http clinet
app.configure('production|development', 'area|auth|connector', function() {
  var httpclient = require('./app/dao/http/httpclient').init(app);
  app.set('httpclient', httpclient);

  //require('./app/dao/fightSkillDao').getFightSkillsByPlayerId(1);
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
