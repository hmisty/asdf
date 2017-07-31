var wx = require('../lib/wx');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var wx = wx.get_ticket();
  res.render('index', { title: 'Express', ticket: wx});
});

module.exports = router;
