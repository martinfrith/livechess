const theme1 = 'html, body, .navbar, .navbar-dropdown, .navbar-burger, .navbar-menu, .navbar-item, .navbar-link'
const theme2 = 'h1, h2, h3, h4, h5, h6, p'
const translations = {
  not_enough_params : 'No hay suficientes parámetros.',
  thankyou_for_browsing : 'Gracias por seguir las partidas en AjedrezEV.',
  cannot_create_room_twice : 'No se puede crear el misma partida dos veces'
}
var ts = function(){ return new Date().getTime() },
parseHelpers = {timeSpan : function(id){
  var timestamp = id.toString().substring(0,8)
  var date = new Date( parseInt( timestamp, 16 ) * 1000 )
  return moment(date).fromNow()
}},
ralfnum = function (a){ return Math.random().toString(36).substring(2, a) + Math.random().toString(36).substring(2, a)},
switchNightmode = function (){
  var nightmode = localStorage.getItem("nightmode")
  if (!nightmode || nightmode === 'no'){
    $(theme1).css({"background": "black","color": "#f8f8f8"});
    $(theme2).css({"color": "#f8f8f8"});
    localStorage.setItem("nightmode", "yes");
  } else {
    $(theme1).css({"background": "white","color": "#4a4a4a"});
    $(theme2).css({"color": "#4a4a4a"});
    localStorage.setItem("nightmode", "no");
  }
}, 
playAudio = function(audio) {
  if(audio===undefined) audio = "move";
  var audio = new Audio('/audio/' + audio + '.ogg');
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
        return location.href = ['live',res.secret_room,res.room].join('/')
      }
    }
  })
})

$(document).ready(function() {
  // Check for click events on the navbar burger icon

  const nightmode = localStorage.getItem("nightmode")
  show_notification(localStorage.getItem('notification'))

  $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
  });

  if(location.pathname != '/'){
    $('a[href="' + location.pathname + '"]').addClass('is-active')
  }

  if(nightmode){
    if(nightmode === 'yes'){
      $(theme1).css({"background": "black","color": "#f8f8f8"});
      $(theme2).css({"color": "#f8f8f8"});
    }
  }
});

moment.locale('es')
$.views.settings.delimiters("[[", "]]");
$.ajaxSetup({
	cache: false,
	headers: { contentType: "application/json" }
});
