var getPem = require('rsa-pem-from-mod-exp');
var crypto = require('crypto');
var base64url = require('base64url');
var fs = require('fs');
const path = require('path');
const { logger } = require('../utils');

var jwtverify = function(token, res) {
  var keys = [];

  //get keys path from config file
  var idp_keys_path = process.env.idp_keys_path;
  try {
    fs.readdirSync(idp_keys_path).forEach((file) => {
      try {
        logger.info(
          `loading keys from file : ${idp_keys_path}${path.sep}${file}`
        );
        var local_keys = JSON.parse(
          fs.readFileSync(idp_keys_path + path.sep + file)
        );

        local_keys.keys.forEach((key) => {
          keys.push(key);
        });
      } catch (error) {
        //error reading keys files
        logger.error(`Error reading keys files. ${error.stack}`);
        res.status(500);
        res.json({
          error: '500',
          error_description: 'Server Error see log file',
        });
        return;
      }
    });
  } catch (error) {
    logger.error(`Missing OKTA Keys Directory. ${error.stack}`);
    res.status(500);
    res.json({
      error: '500',
      error_description: 'Server Error see log file',
    });
    return;
  }

  //number of seconde since epoch
  var actuTime = new Date() / 1000;
  //Verify token params
  if (token == undefined || token == '') {
    //Bad error request
    res.status(400);
    res.json({
      error: 'Invalid_request',
      error_description:
        "The 'token' parameter is required in x-www-form-urlencoded.",
    });
  } else {
    try {
      var parts = null;
      var headerBuf = null;
      var bodyBuf = null;
      var header = null;
      var body = null;
      var content = null;
      var signature = null;
      try {
        //decoding the jwt
        parts = token.split('.');
        headerBuf = new Buffer(parts[0], 'base64');
        bodyBuf = new Buffer(parts[1], 'base64');
        header = JSON.parse(headerBuf.toString());
        body = JSON.parse(bodyBuf.toString());
        content = parts[0] + '.' + parts[1];
        signature = parts[2];
      } catch (error) {
        //Error response
        logger.info(`JWT malformed. ${error}`);
        res.status(400);
        res.json({
          active: false,
          error_msg: 'JWT malformed',
        });
        return;
      }

      //creating the RSA public key
      //getting modulus and exponent from config file where kid == header.kid
      var modulus = null;
      var exponent = null;

      for (var i = 0; i < keys.length; i++) {
        if (keys[i].kid == header.kid) {
          modulus = keys[i].n;
          exponent = keys[i].e;
        }
      }

      if (!modulus || !exponent) {
        //Error response
        res.json({
          error: 'Bad Request',
          error_description:
            ' The token was generated with an unspecified key.',
        });
        return;
      }

      //creating the pem publicKey
      var pem = null;
      try {
        pem = getPem(modulus, exponent);
      } catch (error) {
        //Error response
        logger.error(`Failed to creat pem publicKey. ${error.stack}`);
        res.status(500);
        res.json({
          error: '500',
          error_description: 'Server Error see log file',
        });
        return;
      }

      //expired token condition
      if (body.exp > actuTime) {
        var publicKey = pem;
        try {
          signature = base64url.toBase64(signature);
          verifier = crypto.createVerify('RSA-SHA256');
          verifier.update(content);
        } catch (error) {
          //Error response
          logger.error(`Failed to validate signature. ${error.stack}`);
          res.status(500);
          res.json({
            error: '500',
            error_description: 'Server Error see log file',
          });
          return;
        }

        //validation token signature
        if (verifier.verify(publicKey, signature, 'base64')) {
          //console.log('Valide Signature');
          res.json({
            active: true,
            username: body.name,
            email: body.email,
            exp: body.exp,
            iat: body.iat,
            aud: body.aud,
            iss: body.iss,
            jti: body.jti,
            idp: body.idp,
            token_type: 'Bearer',
          });
        } else {
          res.json({
            active: false,
            error: 'Invalid Signature',
          });
        }
      } else {
        res.json({
          active: false,
          error: 'Expired token try to get new token.',
        });
      }
    } catch (error) {
      logger.error(`UnKnown Error. ${error.stack}`);
      res.status(500);
      res.json({
        active: false,
        error_msg: 'Server Error see log file',
        error: error.message,
      });
    }
  }
};

module.exports = {
  jwtverify: jwtverify,
};
