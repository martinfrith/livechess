$(document).on('click','#nightmode',function(){
  switchNightmode()
})

$(document).keydown(function(e) {
  if(e.keyCode == 37){
    $('#back').click()
  } else if(e.keyCode == 38){
    $('#last').click()
  } else if(e.keyCode == 39){
    $('#next').click()
  } else if(e.keyCode == 40){
    $('#first').click()
  } else if(e.keyCode == 70){
    $('#flip').click()
  } else if(e.keyCode == 78){
    $('#nightmode').click()
  }
});

$(document).ready(function() {
  var socket = io()  
  var board,
    boardEl = $('#board'),
    room = location.pathname.replace('/',''),
    data = {},
    synced = false,
    game = new Chess()

  var removeHighlights = function() {
    boardEl.find('.square-55d63')
      .removeClass('highlight-last');
  }

  var addHightlights = function(move){
    removeHighlights();
    if(move){
      boardEl.find('.square-' + move.from).addClass('highlight-last');
      boardEl.find('.square-' + move.to).addClass('highlight-last');   
    }
  }

  var updateStatus = function(move) {
    var status = '',
    moveColor = 'Blancas',
    turn = game.turn(),
    pgn = game.pgn(),
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn')    

    if (turn === 'b') {
      moveColor = 'Negras';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
      status = 'Juego finalizado. ' + moveColor + ' en jaquemate.';
    }

    // draw?
    else if (game.in_draw() === true) {
      status = 'Juego finalizado, tablas.';
    }

    // game still on
    else {
      status = moveColor + ' por mover.';

      // check?
      if (game.in_check() === true) {
        status += ', ' + moveColor + ' están en jaque.';
      }
    }
    playAudio()
    statusEl.html(status);
    fenEl.html(game.fen());
    pgnEl.html(pgn);
    // mark last move
    addHightlights(move)    
  };
  
  socket.emit('join', room);  //join room as defined by query parameter in URL bar

  socket.on('undo', function(){ //remote undo by peer
    game.undo()
    updateStatus();
    board.position(game.fen());
  })

  socket.on('move', function(moveObj){ //remote move by peer
    console.log('peer move: ' + JSON.stringify(moveObj));
    var move = game.move(moveObj)
    if (move === null) {
      return;
    }
    updateStatus(move);
    lastMove = move;
    board.position(game.fen());
  });

  socket.on('data', function(dataObj){ //remote move by peer
    console.log('data updated: ' + JSON.stringify(dataObj));
    $('.gameinfo').html($.templates("#gameinfo").render(dataObj));
    ['white','black','whiteelo','blackelo'].forEach(function(entry){
      if(dataObj[entry]){
        $('#'+entry).text(dataObj[entry]);
      }
    });
  });

  $.ajax({
    url:'/games',
    method:'POST',
    data: {room:room},
    success:function(res){
      const match = res[0]
      data = match;
      $('.spinner-content').html($.templates("#match").render(match)).promise().done(function (){
        $('.gameinfo').html($.templates("#gameinfo").render(match))
        var pos = 'start'

        boardEl = $('#board')

        if(data.fen){
          pos = data.fen
        }

        var cfg = {
          draggable: false,
          position: pos
        };

        if(data.pgn){
          game.load_pgn(data.pgn)
        }

        board = ChessBoard('board', cfg)
        board.position(game.last())
        updateStatus(data);

        setTimeout(function(){

          var firstEl = $('#first'),
          nextEl = $('#next'),
          backEl = $('#back'),
          lastEl = $('#last'),
          flipEl = $('#flip')

          backEl.click(function(){
            board.position(game.back())
            removeHighlights()
          })

          nextEl.click(function(){
            board.position(game.next())
            removeHighlights()
          })

          firstEl.click(function(){
            board.position(game.first())
            removeHighlights()
          })

          lastEl.click(function(){
            board.position(game.last())
          })

          flipEl.click(function(){
            board.flip()
            addHightlights()
            var head = $('.boardhead').html(),
            foot = $('.boardfoot').html()
            $('.boardhead').html(foot)
            $('.boardfoot').html(head)
          })   

        },750)
      })  

      $('.spinner-container').fadeOut('fast', function(){
        $('.spinner-content').fadeTo('slow',1)
      })
    }
  })
})