//get config file
require('dotenv-flow').config({
  cwd: './config',
  default_node_env: 'development',
});

const { logger } = require('./utils');
var bcontinue = true;

logger.info(`Environement : ${process.env.NODE_ENV}`);

var express = require('express');
var bodyParser = require('body-parser');
var samlverifyer = require('./samlverify');
var jwtverifyer = require('./jwtverify');
var https = require('https');
var http = require('http');
var fs = require('fs');
var auth = require('http-auth');

// set server paramas.
var sslport = process.env.sslport;
var port = process.env.port;

// creat Express object.
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set route object
var myRouter = express.Router();

// saml token validation endpoint
myRouter.route('/authokta/api/v1/samlverify').post(function(req, res) {
  //read token from body request
  var rawAssertion = req.body.samltoken;
  samlverifyer.samlverify(rawAssertion, res, req);
});

// jwt token validation endpoint
myRouter.route('/authokta/api/v1/jwtverify').post(function(req, res) {
  //read token from body request
  var token = req.body.token;
  jwtverifyer.jwtverify(token, res, req);
});

// monitoring endpoint
myRouter.route('/authokta/api/v1/monitoring').get(function(req, res) {
  //read token from body request
  res.json({
    Service: 'enable',
    date: new Date().toString(),
  });
});

//set route variable to be used by app
app.use(myRouter);

// start server
if (process.env.NODE_ENV == 'development') {
  /* http server */
  var httpServer = http.createServer(app);
  httpServer
    .listen(port, function() {
      logger.info(`Server HTTP started on port : ${port}`);
    })
    .on('error', (err) => {
      logger.error(`Cannot start server : ${err.stack}`);
    });
} else {
  //HTTPS Params
  try {
    var privateKey = fs.readFileSync(process.env.ssl_cert_path);
    var certificate = fs.readFileSync(process.env.ssl_pem_path);
    var credentials = {
      key: privateKey,
      cert: certificate,
      requestCert: false,
      rejectUnauthorized: false,
    };
  } catch (error) {
    bcontinue = false;
    logger.error(`Error reading ssl certificate file : ${error}`);
    setTimeout(function timeout() {
      process.exit(1);
    }, 1000);
  }

  if (bcontinue) {
    //Authorizations
    try {
      var basic = auth.basic({
        realm: 'Global Area',
        file: process.env.htpasswd_path,
      });
    } catch (error) {
      logger.error(`Error reading htpassword file : ${error}`);
      setTimeout(function timeout() {
        process.exit(1);
      }, 1000);
    }

    //Protection des routes
    myRouter.use(auth.connect(basic));

    /* https server */
    var httpsServer = https.createServer(basic, credentials, app);
    httpsServer
      .listen(sslport, function() {
        logger.info(`Server HTTPS started on port : ${sslport}`);
      })
      .on('error', (err) => {
        logger.error(`Cannot start server : ${err.stack}`);
      });
  }
}
