$(document).ready(function() {
  var socket = io();  

  var board,
    game = new Chess(),
    boards = [],
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn');

  $(window).resize(function(){
    boards.forEach(function(board){
      board.resize()  
    })    
  })

  var searchEl = $('#search')
  searchEl.submit(function(){
    $('#searchbtn').prop('disabled',true).addClass('is-loading')
    var data = {};
    $(this).serializeArray().map(function(x){data[x.name] = x.value;});       
    findGames(data.query)    
    return false
  })

  var findGames = function(query){
    var data = {query:query}
    $.ajax({
      url:'/search',
      method:'POST',
      data: data,
      success:function(res){

        $('#searchbtn').prop('disabled',false).removeClass('is-loading')
        $('#gamecount').html('')

        if(!res.length){

          $('#boards').html($.templates("#empty").render(data)).promise().done(function (){
            $('.spinner-container').fadeOut('fast', function(){
              $('.spinner-content').fadeTo('slow',1)
            })
          })

          return false
        }

        var s = res.length > 1 ? 's':''
        $('#gamecount').html(res.length + " partida" + s + " encontrada" + s)

        // inject html boards
        $('#boards').html($.templates("#match").render(res,parseHelpers)).promise().done(function (){
          // check for last moves on every game
          $(res).each(function(i,match){

            var pos = 'start'

            if(match.fen){
              pos = match.fen
            } 

            if(match.pgn){
              game.load_pgn(match.pgn)
            }

            var cfg = {
              draggable: false,
              position: pos
            };

            boards[i] = ChessBoard(match.room, cfg);  
            
            if(match.pgn && pos == 'start'){
              boards[i].position(game.last())
            }    
          }) 

          $('.spinner-container').fadeOut('fast', function(){
            $('.spinner-content').fadeTo('fast',1)
          })
        })
      }
    })  
  }
  // do not pick up pieces if the game is over
  // only pick up pieces for the side to move
  var updateStatus = function() {
    var status = '';

    var moveColor = 'White';
    if (game.turn() === 'b') {
      moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
      status = 'Game over, ' + moveColor + ' is in checkmate.';
    }

    // draw?
    else if (game.in_draw() === true) {
      status = 'Game over, drawn position';
    }

    // game still on
    else {
      status = moveColor + ' to move';

      // check?
      if (game.in_check() === true) {
        status += ', ' + moveColor + ' is in check';
      }
    }
    statusEl.html(status);
    fenEl.html(game.fen());
    pgnEl.html(game.pgn());
  };

  socket.on('move', function(moveObj){ //remote move by peer
    console.log('peer move: ' + JSON.stringify(moveObj));
     var move = game.move(moveObj);
    // illegal move
    if (move === null) {
      return;
    }
    updateStatus();
    board.position(game.fen());
	});

  var query = $('input[name="query"]').val().trim()||location.hash.replace('#','')
  if(query!==''){
    $('input[name="query"]').val(query)
    findGames(query)
  } else {
    $.ajax({
      url:'/gamecount',
      method:'POST',
      success:function(res){
        $('#gamecount').html($.templates("#count").render({count:res})).promise().done(function (){
          $('.spinner-container').fadeOut('fast', function(){
            $('.spinner-content').fadeTo('fast',1)
          })
        })
      }
    })	
  }
  $('input[name="query"]').focus()
});