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

  var removeHighlights = function(room) {
    $('#'+room).find('.square-55d63')
      .removeClass('highlight-last');
  }

  var addHightlights = function(move){
    var board = $('#'+move.room)
    if(move && board.length){
      removeHighlights(move.room);
      board.find('.square-' + move.from).addClass('highlight-last');
      board.find('.square-' + move.to).addClass('highlight-last');   
    }
  }

  var findGames = function(){
    $('#boards').html('')
    $('.spinner-content').fadeOut('fast', function(){
      $('.spinner-container').fadeTo('fast',1)
    })    
    $.ajax({
      url:'/online',
      method:'POST',
      success:function(res){
        if(!res.length){
          $('.empty-container').html($.templates("#empty").render()).promise().done(function (){
            $('.spinner-container').fadeOut('fast', function(){
              $('.spinner-content, .empty-container').fadeTo('slow',1)
            })
          })
          return false
        } else {
          $('.empty-container').fadeOut()
        }

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

            boards[match.room] = ChessBoard(match.room, cfg);  
            
            if(match.pgn && pos == 'start'){
              boards[match.room].position(game.last())
            }    

            updateStatus(match)
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
  var updateStatus = function(move) {
    playAudio()
    addHightlights(move)
  };

  socket.on('data', function(dataObj){ //remote move by peer
    findGames()
  })

  socket.on('move', function(moveObj){ //remote move by peer
    if($.inArray(moveObj.room,Object.keys(boards)) === -1){
      findGames()
    }

    if(boards[moveObj.room]){
      var move = game.move(moveObj);
      // illegal move
      if (move === null) {
        return;
      }
      updateStatus(moveObj);
      boards[moveObj.room].position(game.fen());
    }
	});

  findGames()
});