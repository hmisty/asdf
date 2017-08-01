var wx = require('../lib/wx');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var full_url = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log(full_url);
  var subtitle = req.query.subtitle;
  var server_id = req.query.sid;
  var expires_at = req.query.t;
  var is_expired = expires_at < new Date().getTime();
  wx.get_signed_data(full_url, (data) => {
    data.title = '幻听酱';
    data.subtitle = subtitle ? subtitle : '没有声音';
    data.server_id = server_id ? server_id : undefined;
    data.burned_display = is_expired ? "block" : "none";
    data.vinyl_display = is_expired ? "none" : "block";
    res.render('index', data);
  });
});

module.exports = router;
