// handy helper functions EL20170731
var crypto = require('crypto');

// calculate the hash for a string
exports.hash = str => {
  console.log('hash str: ' + str);
  var sha1 = crypto.createHash('sha1');
  var buf = new Buffer(str); //be the old driver!!!
  sha1.update(buf);
  return sha1.digest('hex');
}

// get a random hash string for nonce
exports.nonce = () => {
  return this.hash(Math.random() * 10000);
}

// calculate the signature
exports.sign = json => {
  var str = Object.keys(json).sort().map(k => k + '=' + json[k]).join('&');
  return this.hash(str);
}

