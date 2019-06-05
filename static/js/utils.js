if($.inArray([window.location.protocol,'',window.location.host].join('/'),['http://localhost:3000','https://ajedrezenvivo.net']) == -1){
  location.href='https://ajedrezenvivo.net'
}

const translations = {
  not_enough_params : 'No hay suficientes parámetros.',
  thankyou_for_browsing : 'Gracias por seguir las partidas en AjedrezEV.',
  cannot_create_room_twice : 'No se puede crear el misma partida dos veces'
}
var ts = function(){ return new Date().getTime() },
parseHelpers = {
  timeSpan : function(id){
    var timestamp = id.toString().substring(0,8)
    var date = new Date( parseInt( timestamp, 16 ) * 1000 )
    return moment(date).fromNow()
  },
  parseResult(result,p){
    if(p==='w'){
      return result.split('-').reverse()[0]
    } else if(p==='b'){
      return result.split('-')[0]
    }
  },
  abbrRoom:function(id){
    if(id && id.length){
      return id.substr(-5)
    }
  },
  countMoves: function(pgn){
    if(pgn && pgn.indexOf('.')){
      return pgn.split('.').length - 1
    }
  },
  pgnIndex:function(pgn,result){
    var data = []
    ,index = 0
    , selectedIndex = parseInt(location.hash.replace('#',''))
    pgn.split('.').forEach(function(turn,i){
      turn.split(' ').forEach(function(move){
        if(move.length){
          if(isNaN(move) && move.length > 1){
            var mindex = ""
            , cls = ''
            if((index+1)%2||index===0){
              mindex = (Math.ceil(index/2) + 1) + ". "
            }
            if(index===selectedIndex){
              cls='active'
            }
            data.push(mindex + '<a class="moveindex ' + cls + '" href="#' + index + '">' + move + '</a>')
            index++
          }
        }
      })
    })
    return data.join(' ') + ' ' + result
  }
},
ralfnum = function (a){ return Math.random().toString(36).substring(2, a) + Math.random().toString(36).substring(2, a)},
switchNightmode = function (){
  var nightmode = localStorage.getItem("nightmode")
  if (!nightmode || nightmode === 'no'){
    $('html').addClass('nightmode')
    localStorage.setItem("nightmode", "yes");
  } else {
    $('html').removeClass('nightmode')
    localStorage.setItem("nightmode", "no");
  }
}, 
switchMusic = function (){
  var musicmode = localStorage.getItem("musicmode")
  if (!musicmode || musicmode === 'no'){
    $('html').addClass('musicmode')
    localStorage.setItem("musicmode", "yes");
  } else {
    $('html').removeClass('musicmode')
    localStorage.setItem("musicmode", "no");
  }
}, 
playAudio = function(audio,vol) {
  if(vol===undefined) vol = 1
  if(audio===undefined) audio = "move";
  var audio = new Audio('/audio/' + audio + '.ogg');
  audio.vol = vol
  audio.play();
},
notification = function(notification){
  localStorage.setItem("notification",JSON.stringify(notification))
},
show_notification = function(notification){
  notification = JSON.parse(notification)
  if(notification){
    notification.message = translations[notification.message]||notification.message
    $('body').prepend($.templates("#notification").render(notification)).promise().done(function (){
      //$('.notification').fadeIn()
      localStorage.removeItem('notification')
    })
  }
}

$(document).on('click','.delete',function() {
  $('.notification').fadeOut('fast');
})

$(document).on('click','#create',function(e) {
  e.preventDefault()
  const room = ralfnum(8)
  $(this).prop('disabled',true).addClass('is-loading')
  $.ajax({
    url:'/create/' + room,
    method:'POST',
    success:function(res){
      if(res.status==='danger'){
        localStorage.setItem('noti',{error:'Esta emisión ya está creada. Mejor crea otra.'})
        return location.href = '/'
      }
      else if(res.status==='success'){
        return location.href = ['live',res.secret_room,res.room].join('/') + '#info'
      }
    }
  })
})

$(document).ready(function() {
  // Check for click events on the navbar burger icon

  const nightmode = localStorage.getItem("nightmode")
  const musicmode = localStorage.getItem("musicmode")

  show_notification(localStorage.getItem('notification'))

  $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
  });

  if(location.pathname != '/'){
    $('a[href="' + location.pathname + '"]').addClass('is-active')
  }

  if(location.pathname.split('/').reverse()[2] == 'live'){
    $('#create').hide()
  } else {
    setTimeout(function(){
      $('#create').fadeIn('slow')
    },1000)    
  }

  if(nightmode){
    if(nightmode === 'yes'){
      $('html').addClass('nightmode')
    }
  }

  if(musicmode){
    if(musicmode === 'yes'){
      $('html').addClass('musicmode')
    }
  }
});

$(document).keydown(function(e) {
  if(e.shiftKey && e.keyCode == 78){
    switchNightmode()
  } else if(e.shiftKey && e.keyCode == 77){
    switchMusic()
  }
});

$(document).on('submit','#search',function(){
  location.href = '/results?q=' + encodeURIComponent($('input[name=query]').val().trim())
  return false
})

moment.locale('es')
$.views.settings.delimiters("[[", "]]");
$.ajaxSetup({
	cache: false,
	headers: { contentType: "application/json" }
});
