var $$ = (x) => document.getElementById(x);
var asdf = {};

function set_control(mode, status) {
  var control = $$("control");
  if (mode == 'play') { //播放
    if (status == 'stopped') {
      delete asdf['playing'];
      control.src = "/images/stopbig@3x.png";
      control.onclick = playOrPause;
    } else if (status == 'playing') {
      asdf.playing = true;
      control.src = "/images/pausebig@3x.png";
      control.onclick = playOrPause;
    }
  } else if (mode == 'record') { //录音
    if (status == 'stopped') {
      delete asdf['recording'];
      control.src = "/images/stopbig@3x.png";
      control.onclick = playOrPause; //outbound to playOrPause
      $$("subtitle").style.display = 'none';
      $$("share").style.display = 'inline-block';
    } else if (status == 'recording') {
      asdf.recording = true;
      control.src = "/images/pausebig@3x.png";
      control.onclick = recordOrStop;
    }
  }
}

function update_local_id(local_id) {
  $$('local_id').innerHTML = local_id;
}

function update_server_id(server_id) {
  $$('server_id').innerHTML = server_id;
}

wx.ready(function(){
  //alert('wx.ready()');
  //document.getElementById('voice').style.display = 'block;';

  asdf.start_record = function () {
    wx.startRecord();
  }

  asdf.stop_record = function () {
    wx.stopRecord({
      success: function (res) {
        asdf.local_id = res.localId;
        update_local_id(asdf.local_id);
        console.log('recorded voice has local id: ' + asdf.local_id);
      }
    });
  }

  wx.onVoiceRecordEnd({
    // 录音时间超过一分钟没有停止的时候会执行 complete 回调
    complete: function (res) {
      asdf.local_id = res.localId; 
      update_local_id(asdf.local_id);
      console.log('recorded voice auto-completed which has local id: ' + asdf.local_id);
      set_control('record', 'stopped');
    }
  });

  asdf.play_voice = function () {
    wx.playVoice({
      localId: asdf.local_id
    });
  }

  asdf.pause_voice = function () {
    wx.pauseVoice({
      localId: asdf.local_id
    });
  }

  asdf.stop_voice = function () {
    wx.stopVoice({
      localId: asdf.local_id
    });
  }

  wx.onVoicePlayEnd({
    //监听语音播放完毕事件
    success: function (res) {
      asdf.local_id = res.localId; // 返回音频的本地ID
      console.log('voice ' + asdf.local_id + ' played');
      set_control('play', 'stopped');
    }
  })

  asdf.upload_voice = function (next) {
    if (asdf.local_id) {
      wx.uploadVoice({
        localId: asdf.local_id, // 需要上传的音频的本地ID，由stopRecord接口获得
        isShowProgressTips: 1, // 默认为1，显示进度提示
        success: function (res) {
          asdf.server_id = res.serverId; // 返回音频的服务器端ID
          update_server_id(asdf.server_id);
          console.log('voice uploaded, server id is ' + asdf.server_id);
          next();
        }
      });
    } else {
      console.log('no local voice to upload');
    }
  }

  asdf.download_voice = function (next) {
    if (asdf.server_id) {
      wx.downloadVoice({
        serverId: asdf.server_id, // 需要下载的音频的服务器端ID，由uploadVoice接口获得
        isShowProgressTips: 1, // 默认为1，显示进度提示
        success: function (res) {
          asdf.local_id = res.localId; // 返回音频的本地ID
          update_local_id(asdf.local_id);
          console.log('voice downloaded, local id is ' + asdf.local_id);
          next();
        }
      });
    } else {
      console.log('unknown server id of voice to download');
    }
  }

});

function playOrPause() {
  if (asdf.local_id) {
    if (asdf.playing) {
      asdf.pause_voice();
      set_control('play', 'stopped');
    } else {
      asdf.play_voice();
      set_control('play', 'playing');
    }
  } else {
    if (asdf.server_id && asdf.subtitle) {
      $$("subtitle").innerHTML = '下载中...';
      asdf.download_voice(function () {
        $$("subtitle").innerHTML = asdf.subtitle;
      });
      playOrPause();
    } else {
      alert("没有什么可播放的，快点按钮来录一段分享给朋友们吧！");
    }
  }
}

function recordOrStop() {
  if (asdf.recording) {
    asdf.stop_record();
    set_control('record', 'stopped');
  } else {
    asdf.start_record();
    set_control('record', 'recording');
  }
}

function newRecord() {
  asdf.start_record();
  set_control('record', 'recording');
}

function share() {
  asdf.subtitle = prompt('给你的幻听酱起个好听的标题吧？');
  $$("subtitle").innerHTML = asdf.subtitle;
  $$("share").style.display = 'none';
  asdf.upload_voice(function () {
    location.href = location.protocol + '//' + location.host + '?'
      + 'subtitle=' + asdf.subtitle + '&sid=' + asdf.server_id;
  });
}

