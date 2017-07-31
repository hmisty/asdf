var wx = require('../lib/wx');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var full_url = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log(full_url);
  wx.get_signed_data(full_url, (data) => {
    data.title = '幻听段子酱';
    res.render('index', data);
  });
});

module.exports = router;
