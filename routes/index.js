var wx = require('../lib/wx');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  wx.get_ticket((err, ticket) => {
    res.render('index', { title: 'Express', ticket: ticket});
  });
});

module.exports = router;
