var theme1 = 'html, body, .navbar, .navbar-dropdown, .navbar-burger, .navbar-menu, .navbar-item, .navbar-link',
theme2 = 'h1, h2, h3, h4, h5, h6, p',
ts = function(){ return new Date().getTime() },
ralfnum = function (){ return Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)},
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
}

$(document).ready(function() {
  // Check for click events on the navbar burger icon

  var nightmode = localStorage.getItem("nightmode")

  $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
  });

  $('#create').click(function() {
    $(this).prop('disabled',true).addClass('is-loading')
  	location.href = '/live/' + ralfnum() + '#info'
  })

  if(nightmode){
    if(nightmode === 'yes'){
      $(theme1).css({"background": "black","color": "#f8f8f8"});
      $(theme2).css({"color": "#f8f8f8"});
    }
  }
});

$.views.settings.delimiters("[[", "]]");
$.ajaxSetup({
	cache: false,
	headers: { contentType: "application/json" }
});
