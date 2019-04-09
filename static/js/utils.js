var nightmode = localStorage.getItem("nightmode")||"no"
function ts(){ return new Date().getTime() }
function ralfnum(){ return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5)}
function switchnightmode(){
  var targets = 'html, body, .navbar, .navbar-menu, .navbar-burger, .navbar-item, .navbar-link'
  if (localStorage.getItem("nightmode") == 'no'){
    $(targets).css({"background": "#333","color": "#f8f8f8"});
    localStorage.setItem("nightmode", "yes");
  } else {
    $(targets).css({"background": "white","color": "#4a4a4a"});
    localStorage.setItem("nightmode", "no");
  }
}

$(document).ready(function() {

  // Check for click events on the navbar burger icon
  $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
  });

  $('#create').click(function() {
    $(this).prop('disabled',true).addClass('is-loading')
  	location.href = '/live/' + ralfnum() + '#info'
  })

  if(nightmode === 'yes'){
    //switchnightmode()  
  }  
});

$.views.settings.delimiters("[[", "]]");
$.ajaxSetup({
	cache: false,
	headers: { contentType: "application/json" }
});
