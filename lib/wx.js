// some wx helpers EL20170731
/* to try:
 * $ node
 * > var wx = require(./lib/wx);
 * > wx.get_token((err, token) => { console.log(token) })
 * > wx.get_ticket((err, ticket) => { console.log(ticket) })
 */
var fs = require('fs');
var fetch = require('node-fetch');

// the promise & memory cache
var wx = {
  app_id: '',
  app_secret: '',
  current_token: {
    token: '',
    expires_at: ''
  },
  current_ticket: {
    ticket: '',
    expires_at: ''
  },
};

/* File format:
 * APP_ID,APP_SECRET
 */
var APP_ID_FILE = './WXAPP_ID_SECRET';
var TOKEN_FILE = '/tmp/ASDF_TOKEN';
var TICKET_FILE = '/tmp/ASDF_TICKET';

// the config
//var MOCK = true;
var MOCK = false;
var DEBUG = true;

var GET_TOKEN_URI = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s';
var GET_TICKET_URI = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=%s&type=jsapi';

// logger
wx.log = (m) => {
  console.log(m);
}

// get wechat app_id
// next = (err, app_id, app_secret) => { }
wx.get_app_id = (next) => {
  if (wx.app_id == '') {
    wx.log('read app_id from file ' + APP_ID_FILE);

    fs.readFile(APP_ID_FILE, (err, data) => {
      if (err) { //TODO better handle err 
        wx.log(err);
        next(-1, '', '');
      }

      var idsec = data.toString().replace('\n', '').split(',');
      wx.app_id = idsec[0];
      wx.app_secret = idsec[1];
      next(0, wx.app_id, wx.app_secret);
    });
  } else {
    wx.log('already know app_id');
    next(0, wx.app_id, wx.app_secret);
  }
}

// read token from local cache file
// next = (err, token) => { }
wx.get_token_local = (next) => {
  wx.log('read token from local cache file ' + TOKEN_FILE);

  fs.readFile(TOKEN_FILE, (err, data) => {
    if (err) { // cannot read cache file, try remote
      wx.log('cannot read token from local cache, try remote');
      wx.get_app_id((err, app_id, app_secret) => {
        wx.get_token_remote(next);
      });
    } else {
      var token = data.toString().replace('\n', '').split(',');
      wx.current_token.token = token[0]
      wx.current_token.expires_at = token[1];
      wx.if_token_expired(next);
    }
  });
}

// save token to local cache file
wx.save_token_local = () => {
  wx.log('save token to local cache file ' + TOKEN_FILE);

  var content = wx.current_token.token + ',' + wx.current_token.expires_at;
  fs.writeFile(TOKEN_FILE, content, (err) => {
    if (err) {
      wx.log('ERROR: cannot write to file ' + TOKEN_FILE);
      throw err;
    }
    wx.log('token saved locally');
  });
}

// get token remote (mock)
// next = (err, token) => { }
wx.get_token_remote_mock = (next) => {
  wx.log('get token remote (mock)');

  var token = 'MOCKEDTOKEN';
  var expires_at = new Date().getTime() + 7200 * 1000; // magic number from weichat doc
  //var expires_at = new Date().getTime() + 3 * 1000; // expires after 3 seconds
  wx.current_token.token = token;
  wx.current_token.expires_at = expires_at;
  wx.save_token_local();
  next(0, token);
}

// get token from wx api server
// next = (err, token) => { }
wx.get_token_remote = (next) => {
  wx.log('get token from wx api server');

  if (MOCK) {
    wx.get_token_remote_mock(next);
  } else {
    var uri = util.format(GET_TOKEN_URI, wx.app_id, wx.app_secret);
    console.log(uri);
    fetch(uri)
      .then(res => res.json())
      .then(json => {
        if (json.errcode == 0) {
          var token = json.access_token;
          var expires_at = json.expires_in * 1000 + new Date().getTime();
          wx.current_token.token = token;
          wx.current_token.expires_at = expires_at;
          wx.save_token_local();
          next(0, token);
        } else {
          console.log('get token remote returns error: ' + json.errmsg);
          next(-1, '');
        }
      }).catch(err => {
        console.log('error get token remote: ' + err);
        next(-1, '');
      });
  }
}

// check if token expires
// next = (err, token) => { }
wx.if_token_expired = (next) => {
  //FIXME if no expires_at?
  if (wx.current_token.expires_at < new Date().getTime() ) {
    wx.log('token expired. get again from remote');
    wx.get_app_id((err, app_id) => {
      wx.get_token_remote(next);
    });
  } else {
    wx.log('token is good');
    next(0, wx.current_token.token);
  }
}

// get wechat token
// next = (err, token) => { }
wx.get_token = (next) => {
  if (wx.current_token.token == '') {
    wx.get_token_local(next);
  } else {
    wx.log('already known token');
    wx.if_token_expired(next);
  }
}

// read ticket from local cache file
// next = (err, ticket) => { }
wx.get_ticket_local = (next) => {
  wx.log('read ticket from local cache file ' + TICKET_FILE);

  fs.readFile(TICKET_FILE, (err, data) => {
    if (err) { // cannot read cache file, try remote
      wx.log('cannot read ticket from local cache, try remote');
      wx.get_token((err, token) => {
        wx.get_ticket_remote(next);
      });
    } else {
      var ticket = data.toString().replace('\n', '').split(',');
      wx.current_ticket.ticket = ticket[0]
      wx.current_ticket.expires_at = ticket[1];
      wx.if_ticket_expired(next);
    }
  });
}

// save ticket to local cache file
wx.save_ticket_local = () => {
  wx.log('save ticket to local cache file ' + TICKET_FILE);

  var content = wx.current_ticket.ticket + ',' + wx.current_ticket.expires_at;
  fs.writeFile(TICKET_FILE, content, (err) => {
    if (err) {
      wx.log('ERROR: cannot write to file ' + TICKET_FILE);
      throw err;
    }
    wx.log('ticket saved locally');
  });
}

// get ticket remote (mock)
// next = (err, ticket) => { }
wx.get_ticket_remote_mock = (next) => {
  wx.log('get ticket remote (mock)');

  var ticket = 'MOCKEDTICKET';
  var expires_at = new Date().getTime() + 7200 * 1000; // magic number from weichat doc
  //var expires_at = new Date().getTime() + 3 * 1000; // expires after 3 seconds
  wx.current_ticket.ticket = ticket;
  wx.current_ticket.expires_at = expires_at;
  wx.save_ticket_local();
  next(0, ticket);
}

// get ticket from wx api server
// next = (err, ticket) => { }
wx.get_ticket_remote = (next) => {
  wx.log('get ticket from wx api server');

  if (MOCK)
    wx.get_ticket_remote_mock(next);
  else {
    var uri = util.format(GET_TICKET_URI, wx.current_token.token);
    console.log(uri);
    fetch(uri)
      .then(res => res.json())
      .then(json => {
        if (json.errcode == 0) {
          var ticket = json.ticket;
          var expires_at = json.expires_in * 1000 + new Date().getTime();
          wx.current_ticket.ticket = ticket;
          wx.current_ticket.expires_at = expires_at;
          wx.save_ticket_local();
          next(0, ticket);
        } else {
          console.log('get ticket remote returns error: ' + json.errmsg);
          next(-1, '');
        }
      }).catch(err => {
        console.log('error get ticket remote: ' + err);
        next(-1, '');
      });
  }
}

// check if ticket expires
// next = (err, ticket) => { }
wx.if_ticket_expired = (next) => {
  //FIXME if no expires_at?
  if (wx.current_ticket.expires_at < new Date().getTime() ) {
    wx.log('ticket expired. get again from remote');
    wx.get_token((err, token) => {
      wx.get_ticket_remote(next);
    });
  } else {
    wx.log('ticket is good');
    next(0, wx.current_ticket.ticket);
  }
}

// get wechat ticket
// next = (err, ticket) => { }
wx.get_ticket = (next) => {
  if (wx.current_ticket.ticket == '') {
    return wx.get_ticket_local(next);
  } else {
    wx.log('already known ticket');
    return wx.if_ticket_expired(next);
  }
}

// export
module.exports = wx;
