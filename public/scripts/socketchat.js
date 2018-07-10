let socket = io.connect();
let localStream, localPeerConnection, remotePeerConnection, x, y, remoteStream;
let globalVideo, globalStream, globalClose;
let REMOTE_CHAT_COUNT = 0;
let ESC_COUNT = 0;
let main_width;
let elem;
let camera_true = true;
let toolsIcons = {
  "camera": true,
  "audio": true,
  "phone": true,
  "fullscreen": true
}
let icontop;
let fff;
let FULL_SCREEN_BUTTON_CLICKED = false;
let ESC_BUTTON_PRESSED = false;
let screenSharedHeight;





$(window).load(function() {
  let video = $('#local-video');
  let width = 1 * window.innerWidth;
  main_width = width;
  let heightmain = window.outerHeight;
  let height = width;
  let left = window.innerWidth / 2 - width / 2;
  let top = window.outerHeight - window.innerHeight - 25;
  let sh = window.innerHeight - 81;
  icontop = heightmain - 74;
  elem = video.find('video')[0];
  elem.muted = true;
  x = top;
  y = height;
  let oldHeight;
  fff = height;

  // alertify
  alertify.defaults.glossary.title = 'video walls alert';
  // Setting toolobar
  setToolbar();


  $('#icons-tools').css({
    'width': .6*height
  });
  //Setting ends..
  $('#local-chat-arrow').css({
    'top': sh / 2 - 16
  });

  screenSharedHeight = sh;


  //FULL SCREEN MODE

  let globalClose = function() {
    socket.emit('remote-disconnected');
    localStream.stop();
    if (remoteStream != undefined) {
      remoteStream.stop();
    }
    localPeerConnection = null;
    remotePeerConnection = null;
  };
  $(document).on('click', '#icons-tools div:eq(5)', function(e) {
    console.log('Inside number 5 clicked !!');
    $(document).one('click', '.main-expand-icon-active', exitFullscreen);
    $(document).one('keyup', function(e) {
      if (e.keyCode == 27) {
        ESC_BUTTON_PRESSED = true;
        ESC_COUNT++;
        toggleFunction("fullscreen", $('#icons-tools div:eq(5)'), "main-expand-icon", "main-expand-icon-active");
      }
    });
    toggleFunction("fullscreen", $(this), "main-expand-icon", "main-expand-icon-active");
    if (globalVideo.requestFullscreen) {
      globalVideo.requestFullscreen();
    } else if (globalVideo.msRequestFullscreen) {
      globalVideo.msRequestFullscreen();
    } else if (globalVideo.mozRequestFullScreen) {
      globalVideo.mozRequestFullScreen();
    } else if (globalVideo.webkitRequestFullscreen) {
      globalVideo.webkitRequestFullscreen();
    }
  });
  //FULL SCREEN MODE ENDS
  //REMOTE VIDEO STOP
  $(document).on('click', '#icons-tools div:eq(0)', function(e) {
    toggleFunction("camera", $(this), "main-camera-icon", "main-camera-icon-active");
    globalStream.getVideoTracks()[0].enabled = !(globalStream.getVideoTracks()[0].enabled);
  });
  //REMOTE VIDEO STOP ENDS
  //REMOTE AUDIO STOP
  $(document).on('click', '#icons-tools div:eq(1)', function(e) {
    toggleFunction("audio", $(this), "main-audio-icon", "main-audio-icon-active");
    localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled);
  });
  //REMOTE AUDIO STOP ENDS
  //4th Button is clicked
  $(document).on('click', '#icons-tools div:eq(4)', function(e) {
    toggleFunction("phone", $(this), "main-phone-drop-icon", ".main-phone-drop-icon-active");
    console.log('drop call clicked!!');
    globalClose();

  });
  //4th button is clicked --ENDS
  video.find('video').css({
    'width': width
  });
  video.css({
    'width': width,
    'height': heightmain,
    'left': left,
    'bottom': 0
  });
  setUserName();
  let constraints = {
    video: true,
    audio: true
  };
  socket.on('available-for-offer', function() {
    console.log('Creating Offer!!!');
    createOffer(localStream);
    showBlackOverlay();
  });
  socket.on('available-for-answer', function(sdp) {
    console.log('Creating Answer!!!!');
    createAnswer(localStream, sdp);
    showBlackOverlay();
  });
  socket.on('available-for-stream', function(sdp) {
    console.log('In final stages...');
    localPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  });
  socket.on('local-candidate-broadcast', function(candidate) {
    console.log('Inside local-candidate-broadcast');
    remotePeerConnection.addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    }));

  });

  socket.on('remote-candidate-broadcast', function(candidate) {
    console.log('Inside remote-candidate-broadcast');
    localPeerConnection.addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    }));
  });

  socket.on('users-final', function(data) {
    console.log('User available for offer is ---> ' + JSON.stringify(data));
    $('#first-speaker').html(data[0]);
    $('#second-speaker').html('with ' + data[1]);
  });

  socket.on('disconnected-user-reset', function() {
    console.log('Resetting!!');
    $('#second-speaker').empty();
    $('#first-speaker').html(socket.username);
    removeRemoteVideo();
  });
  socket.on('remote-candidate-disconnect', function() {
    removeRemoteVideo();
  });
  socket.on('remote-chat-data', function(data) {
    $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble">' + data + '</div></div></div></div>');
    animateChatData();
    incrementBuffer();
  });

  socket.on('different-remote-chat-data', function(file) {

    if (/image/.test(file.type)) {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><div class="file-progress-bar" style="width: 100%; background: none;"><a target="_blank" href="' + file.url + '" id="chat-image-data"><img src="' + file.thumbnailUrl + '" width="160" height="160" style="opacity: 1; display: flex; margin-top: 13px; margin-bottom: 13px;" /></a></div></div></div></div></div>');
    } else if (/video/.test(file.type)) {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><div class="file-progress-bar" style="width: 100%; background: none;"><a target="_blank" href="' + file.url + '" id="chat-video-data"><video src="' + file.url + '" controls="" style="width: 179px; opacity: 1; display: flex; margin-top: 13px; margin-bottom: 13px;"></video></a></div></div></div></div></div>');
    } else if (/audio/.test(file.type)) {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><a target="_blank" href="' + file.url + '"><audio src="' + file.url + '" controls="" style="width: 179px; opacity: 1; display: flex; margin-top: 13px; margin-bottom: 13px;"></audio></a></div></div></div></div>');
    } else {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><div class="file-progress-bar" style="width: 100%; background: none;"><a target="_blank" href="' + file.url + '"><div id="file-name" style="opacity: 1; display: inline-block; color: rgb(0, 0, 0); padding: 10px 13px 9px;">' + file.name + '</div></a></div></div></div></div></div>');
    }
    animateChatData();
    incrementBuffer();

  });

  socket.on('checking-for-screen-share', function(key, users) {
    socket.key = key;
    socket.users = users;
  });

  socket.on('other-guy-screen-share-on', function() {
    socket.screenSharedByRemote = true;
  });

  socket.on('other-guy-screen-share-off', function() {
    socket.screenSharedByRemote = false;
    resetScreenShareByRemote();
  });
  //FUNCTIONS START
  function failure() {
    console.log('Sorry...Could not get the video !!!');
    alertify.alert("Sorry...Could not get the video");
  }

  function success(stream) {
    //THESE VALUES WILL BE CHANGED!!!
    globalVideo = elem;
    globalStream = stream;
    //THESE VALUES WILL BE CHANGED!!!
    localStream = stream;
    //NEW CODE//
    if (window.URL) {
      elem.src = window.URL.createObjectURL(stream);
    } else {
      elem.src = stream;
    }
    //NEW CODE//
    window.xstream = stream;
    console.log('Got Video!!');
    setTimeout(function() {
      socket.emit('checked-stream', true);
    }, 1000);
    setTimeout(function() {
      $('#toolbar').fadeIn(200, function() {
        $('#sidebar-chat-right').animate({
          'height': sh
        }, 400, function() {
          $('#local-chat-arrow').show();
          $('#local-chat-arrow').addClass('zoomIn');
        });
      });
      let iconToolsHeight = 90;
      $('#icons-tools').clone().css({
        'background': 'rgba(42, 56, 143, 0.5)',
        'height': iconToolsHeight,
        'position': 'relative',
        'top': -iconToolsHeight,
        'z-index': -1
      }).empty().appendTo($('#toolbar'));
    }, 1000);
  }

  function getUser() {
    navigator.getUserMedia(constraints, success, failure);
  }



  function setUserName() {
    let userName = generateName();
    setTimeout(function() {
      getUser();
    }, 2000);
    $('#first-speaker').html(userName);
    socket.username = userName;
    socket.emit('username', userName);
  }

});

function addRemoteVideo(top, height, stream) {
  if (!socket.screenSharedByRemote && !socket.screenShared) {
    console.log('INSIDE addRemoteVideo...width is ' + main_width);
    let left = (window.innerWidth - main_width) / 2 + 7;
    $('#remote-video').append($('#my-video'));
    $('#remote-video').find('video').eq(0).addClass('remote-video-right').css({
      'position': 'absolute',
      'height': 150,
      'width': 190,
      'left': left
    }).hide();
    $('#local-video').prepend('<video autoplay style="width: ' + main_width + '"></video>');
    $('#local-video').find('video')[0].src = stream;
    $('#remote-video').find('video')[0].play();
    globalVideo = $('#local-video').find('video')[0];
    setTimeout(function() {
      removeBlackOverlay();
      $('#remote-video').find('video').eq(0).show();
    }, 2000);
  } else if (socket.screenSharedByRemote) {
    //Other guy must have shared the screen..
    console.log('NOW SHOWING OTHER PERSONS SCREEN AS HE HAS SHARED IT');
    globalVideo = $('#my-screen-share')[0];
    window.abc = stream;
    $('#my-screen-share').hide()[0].src = stream;
    $('#local-video video').hide();
    $('#screen-share').css({
      'height': screenSharedHeight
    });
    $('#my-screen-share').css({
      'position': 'relative',
      'height': 'auto',
      'width': main_width,
      'left': 0,
      'z-index': 0,
      'top': 0
    }).parent().css({
      'position': 'absolute',
      'top': 660 - screenSharedHeight
    }).prependTo('#local-video');
    $('#my-screen-share')[0].play();

    setTimeout(function() {
      removeBlackOverlay();
      $('#my-screen-share').show();
    }, 2000);
  }

}

function removeRemoteVideo() {
  if (!socket.screenShared) {
    console.log('INSIDE removeRemoteVideo...width is ' + main_width);
    $('#local-video').find('video').remove();
    $('#local-video').prepend($('#remote-video').find('video').eq(0).removeClass('remote-video-right').css({
      'position': 'absolute',
      'height': 'auto',
      'width': main_width,
      'left': 0
    }));
    $('#remote-video').find('video').remove();
    $('#local-video').find('video')[0].play();
    globalVideo = $('#local-video').find('video')[0];
    globalStream = localStream;
    console.log('FUNCTION ENDED !!!!');
    REMOTE_VIDEO_ON = false;
  } else {
    //Screen must be shared by the user..
    $('#local-video').find('video').remove();
    $('#my-screen-share').hide();
    $('#screen-share').css({
      'height': screenSharedHeight
    });
    $('#my-screen-share').css({
      'position': 'relative',
      'height': 'auto',
      'width': main_width,
      'left': 0,
      'z-index': 0,
      'top': 0
    }).parent().css({
      'position': 'absolute',
      'left': 0,
      'top': 660 - screenSharedHeight,
      'width': 'initial'
    }).prependTo('#local-video');
    $('#my-screen-share').show().addClass('animated fadeInLeft');
    $('#my-screen-share')[0].play();
    globalVideo = $('#my-screen-share')[0];
    //NOW doing the first if condition things...
    $('#local-video').prepend($('#remote-video').find('video').eq(0).removeClass('remote-video-right').css({
      'position': 'absolute',
      'height': 'auto',
      'width': main_width,
      'left': 0
    }));
    $('#remote-video').find('video').remove();
    $('#local-video').find('video')[0].play();
    //ENDS--
    setTimeout(function() {
      socket.screenStream.stop();

    }, 1000);

  }


  // goes back to the previous screen
  setTimeout(function() {
    window.history.back();
  }, 2000);

}

//FUNCTIONS ENDS
//WEBRTC FUNCTIONS --- START
function createOffer(localStream) {
  console.log('Inside createOffer()....');
  let isChrome = !!navigator.webkitGetUserMedia;

  let STUN = {
    url: isChrome ?
      'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
  };

  let iceServers = {
    iceServers: [STUN]
  };
  localPeerConnection = new RTCPeerConnection(iceServers);
  localPeerConnection.onicecandidate = gotLocalIceCandidate;
  localPeerConnection.onaddstream = gotLocalVideo;
  localPeerConnection.addStream(localStream);
  localPeerConnection.createOffer(gotLocalDescription, handleError);
  if (socket.screenSharedByRemote) {
    socket.localScreenPeerConnection = localPeerConnection;
  }
}

function gotLocalDescription(sdp) {
  console.log('Inside gotLocalDescription()....');
  localPeerConnection.setLocalDescription(sdp);
  socket.emit('got-local-description', sdp);
}

function handleError() {
  console.log('Some error has occured during createOffer()');
  alertify.alert('Some error has occured');
}

function gotLocalIceCandidate(event) {
  console.log('Got Local Ice Candidate!!!');
  if (event.candidate != null) {
    console.log(event.candidate);
    socket.emit('local-candidate', event.candidate);
  }
}

function gotLocalVideo(stream) {
  console.log('Inside got LocalVideo!!');
  console.log(stream);
  remoteStream = stream.stream;
  let objstream;
  //NEW CODE//
  if (window.URL) {
    objstream = window.URL.createObjectURL(stream.stream)
  } else {
    objstream = stream.stream;
  }
  //NEW CODE//
  addRemoteVideo(x, y, objstream);
  if (socket.screenSharedByRemote) {
    socket.remoteScreenStream = stream.stream;
  }
  //THESE VALUES WILL BE CHANGED!!!
  //globalStream = remoteStream;
  //THESE VALUES WILL BE CHANGED!!!
}

function createAnswer(localStream, sdp) {
  console.log('Inside createAnswer()....');
  let isChrome = !!navigator.webkitGetUserMedia;

  let STUN = {
    url: isChrome ?
      'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
  };

  let TURN = {
    url: 'turn:homeo@turn.bistri.com:80',
    credential: 'homeo'
  };

  let iceServers = {
    iceServers: [STUN]
  };
  remotePeerConnection = new RTCPeerConnection(iceServers);
  remotePeerConnection.addStream(localStream);
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  remotePeerConnection.onaddstream = gotRemoteVideo;
  remotePeerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  remotePeerConnection.createAnswer(gotRemoteDescription, handleError);
  if (socket.screenSharedByRemote) {
    socket.remoteScreenPeerConnection = remotePeerConnection;
  }
}

function gotRemoteDescription(sdp) {
  console.log('sdp is ' + sdp);
  remotePeerConnection.setLocalDescription(sdp);
  socket.emit('got-remote-description', sdp);
}

function gotRemoteIceCandidate(event) {
  console.log('Got Remote Ice Candidate!!!');
  if (event.candidate != null) {
    console.log(event.candidate);
    socket.emit('remote-candidate', event.candidate);
  }

}

function gotRemoteVideo(stream) {
  console.log('Inside got RemoteVideo!!');
  console.log(stream);
  remoteStream = stream.stream;
  //NEW CODE//
  if (window.URL) {
    objstream = window.URL.createObjectURL(stream.stream)
  } else {
    objstream = stream.stream;
  }
  //NEW CODE//
  addRemoteVideo(x, y, objstream);
  if (socket.screenSharedByRemote) {
    socket.remoteScreenStream = stream.stream;
  }
  //THESE VALUES WILL BE CHANGED!!!
  //THESE VALUES WILL BE CHANGED!!!
}

//WEBRTC FUNCTIONS --- START

//CHAT FUNCTIONALITY ---START

function animateChatData() {
  $('#second-section').scrollTop(oldHeight);
  oldHeight = oldHeight + 270;
}

function recursiveAnimateChatData() {
  $('#second-section').scrollTop(oldHeight);
}

function incrementBuffer() {
  REMOTE_CHAT_COUNT++;
  $('#local-chat-arrow').html('<span id="super-chat-count">' + REMOTE_CHAT_COUNT + '</span>');
  if (REMOTE_CHAT_COUNT === 1) {
    $('#local-chat-arrow').find('#super-chat-count').addClass('shake animated');
    $('#local-chat-arrow').find('#super-chat-count').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      $(this).removeClass();
    });
  }
  console.log('Incremented...REMOTE_CHAT_COUNT is-->' + REMOTE_CHAT_COUNT);
}


function toggleFunction(name, elem, first, second) {
  if (toolsIcons[name]) {
    elem.removeClass();
    elem.addClass(second);
    toolsIcons[name] = !toolsIcons[name];
  } else {
    elem.removeClass();
    elem.addClass(first);
    toolsIcons[name] = !toolsIcons[name];
  }
}


function setToolbar() {
  console.log('Called setToolbar');
  $('#toolbar').css({
    'position': 'relative',
    'top': icontop,
    'width': 'initial'
  });
}



function exitFullscreen() {
  console.log('exitFullscreen called !');
  FULL_SCREEN_BUTTON_CLICKED = true;
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }

}
//CHAT FUNCTIONALITY ---ENDS

//CHECKING IF SCREEN

function resetScreenShareByRemote() {
  socket.remoteScreenStream.stop();
  socket.localScreenPeerConnection = null;
  socket.remoteScreenPeerConnection = null;
  socket.remoteScreenStream = null;
  let hide = $('#screen-share').find('#my-screen-share').hide();
  hide[0].src = '';
  hide.parent().appendTo('body');
  globalVideo = elem;
  $('#local-video video').show().removeClass('animated fadeInLeft').addClass('animated fadeInLeft');
  resetLocalShareScreenDiv();
}

function resetLocalShareScreenDiv() {
  $('#screen-share').css({
    'position': 'initial',
    'height': 'initial',
    'width': 'initial',
    'left': 'initial',
    'top': 'initial'
  });

  $('#screen-share').find('#my-screen-share').css({
    'display': 'initial',
    'position': 'initial',
    'height': 'initial',
    'width': 'initial',
    'z-index': 'initial'
  });
}


// joeydash included function
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function generateName() {
  var name_list = ["yash", "anish", "vaibhav", "nischal", "rhitu", "karishma", "sanskar"];
  var name = name_list[getRandomInt(0, name_list.length + 1)];
  return name;
}
