$(document).ready(function() {
  var socket = io();  

  var board,
    game = new Chess(),
    boards = [],
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn');

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

  $(data).each(function(i,match){

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

    $('#boards').append('<a class="column is-3 has-text-grey"  href="/'+match.id+'"><p><small>'+match.black+'&nbsp;</small><small class="has-text-grey">'+match.blackelo+'</small></p><div id="'+match.id+'"></div><p class="has-text-right"><small>'+match.white+'&nbsp;</small><small class="has-text-grey">'+match.whiteelo+'&nbsp;</small></p></a>')
    boards[i] = ChessBoard(match.id, cfg);  
    if(match.pgn && pos == 'start'){
      boards[i].position(game.last())
    }    
  })  

  //updateStatus();
	
});