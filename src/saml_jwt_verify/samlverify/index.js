var saml = require("../lib/index.js");
var decode = require('urldecode');
var fs = require('fs');
var xmldom = require('xmldom');
var xml2js = require('xml2js');
var config = require('./config.json');


var samlverify = function(rawAssertion, res, req) {

    //decode SAMLResponse url encode to base64
    var xml = new Buffer(decode(rawAssertion), 'base64').toString('utf8');

    /*Parses the xml without validating signature, expiration and audience. It allows geting information from the token to obtain the right public key to validate the token .*/

    saml.parse(xml, function(err, profile) {
        if (err) {
            res.json({
                active: false,
                Error: err.toString(),
            });
        } else {

            //if valid token 
            //get issuer to obtain the right cert
            var issuer = profile.issuer;
            var parts = issuer.split('/');
            var entityID = parts[3];
            var parser = new xml2js.Parser();

            //open the right file name toget cert

            fs.readFile('./IdpsMetadata/metadata_' + entityID + '.xml', function(err, data) {
                console.log(data);
                parser.parseString(data, function(err, result) {

                    //get certificat
                    var certificate = result["md:EntityDescriptor"]["md:IDPSSODescriptor"][0]["md:KeyDescriptor"][0]["ds:KeyInfo"][0]["ds:X509Data"][0]["ds:X509Certificate"][0];

                    //get issuer and audience from config file 
                    var issuerName = config.metadata.issuerName;
                    var audience = config.metadata.audience;

                    //validate SAML token 
                    saml.validate(xml, { publicKey: certificate, audience: audience, bypassExpiration: true }, function(err, profile) {
                        if (err) {
                            res.json({
                                valide: false,
                                Error: err.toString(),
                            });
                        } else {
                            res.json({
                                valide: true,
                                audience: profile.audience,
                                claims: profile.claims,
                                issuer: profile.issuer
                            });
                        }

                    })

                });
            });
        }
    });
};

module.exports = {
    samlverify: samlverify
}