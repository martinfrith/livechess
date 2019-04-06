var generate_id = function (){
	return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5)
}

$(document).ready(function() {

  // Check for click events on the navbar burger icon
  $(".navbar-burger").click(function() {

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

  });

  $('#create').click(function() {
  	location.href = '/live/x' + generate_id() + '#info'
  })
});

$.ajaxSetup({
	cache: false,
	headers: { contentType: "application/json" }
});
