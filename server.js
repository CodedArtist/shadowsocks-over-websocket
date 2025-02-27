var AV = require('leanengine');
var express = require("express");

//
const TCPRelay = require('./tcprelay').TCPRelay;
const server = require('commander');
const constants = require('./constants');
const throng = require('throng');
const log4js = require('log4js');
const logger = log4js.getLogger('server');

server
    .version(constants.VERSION)
    .option('-m --method <method>', 'encryption method, default: aes-256-cfb')
    .option('-k --password <password>', 'password')
    .option('-s --server-address <address>', 'server address')
    .option('-p --server-port <port>', 'server port, default: 8388')
    .option('--log-level <level>', 'log level(debug|info|warn|error|fatal)', /^(debug|info|warn|error|fatal)$/i, 'info')
    .option('--log-file <file>', 'log file')
    .parse(process.argv);

throng({
    // workers: process.env.WEB_CONCURRENCY || 1,
    workers: 1, // 并发数量
    master: startMaster,
    start: startWorker
});


function startMaster() {
    logger.info(' started master');

    AV.init({
        appId: process.env.LEANCLOUD_APP_ID || '{{appid}}',
        appKey: process.env.LEANCLOUD_APP_KEY || '{{appkey}}',
        masterKey: process.env.LEANCLOUD_APP_MASTER_KEY || '{{masterkey}}'
      });
    // init express
    var app = express();
    app.use(AV.express());
    app.get('/', function(req, res) {
        res.sendStatus(200);
    });
    app.listen(3000, function (err) {
        console.log('Node app is running on port:', 3000);
    });
}

function startWorker(id) {
    logger.info(` started worker ${id}`);
    var relay = new TCPRelay({
        serverAddress: process.env['SERVER_ADDRESS'] || process.env['LEANCLOUD_API_SERVER'] || server.serverAddress || '127.0.0.1',
        serverPort: process.env['LEANCLOUD_APP_PORT'] || server.serverPort || 3000,
        password: process.env['PASSWORD'] || server.password || 'aes-256-cfb',
        method: process.env['METHOD'] || server.method || 'aes-256-cfb'
    }, false);

    relay.setLogLevel(server.logLevel);
    relay.setLogFile(server.logFile);
    relay.setServerName(' server-' + id);
    relay.bootstrap();
}
