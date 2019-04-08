$(document).ready(function() {
  var socket = io();  
  var board,
    room = location.pathname.replace('/',''),
    data = {},
    synced = false,
    game = new Chess()

  var updateStatus = function() {
    var status = '',
    moveColor = 'Blancas',
    turn = game.turn(),
    pgn = game.pgn(),
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn')    

    /*
    if(!synced && data.turn){
      turn = data.turn
      pgn = data.pgn
    } */

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
    statusEl.html(status);
    //fenEl.html(game.fen());
    console.log(pgn)
    pgnEl.html(pgn);
  };
  
  socket.emit('join', room);  //join room as defined by query parameter in URL bar

  socket.on('undo', function(){ //remote undo by peer
    game.undo()
    updateStatus();
    board.position(game.fen());
  })

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

  socket.on('data', function(dataObj){ //remote move by peer
    console.log('data updated: ' + JSON.stringify(dataObj));
    $('.matchdata').html($.templates("#matchdata").render(dataObj));
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
        $('.matchdata').html($.templates("#matchdata").render(match))
        var pos = 'start';

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

        board = ChessBoard('board', cfg);
        updateStatus();

        if(data.pgn && pos == 'start'){
          setTimeout(function(){

            var firstEl = $('#first'),
            nextEl = $('#next'),
            backEl = $('#back'),
            lastEl = $('#last'),
            flipEl = $('#flip')

            backEl.click(function(){
              board.position(game.back())
            })

            nextEl.click(function(){
              board.position(game.next())
            })

            firstEl.click(function(){
              board.position(game.first())
            })

            lastEl.click(function(){
              board.position(game.last())
            })

            flipEl.click(function(){
              board.flip()
              var head = $('.boardhead').html(),
              foot = $('.boardfoot').html()
              $('.boardhead').html(foot)
              $('.boardfoot').html(head)
            })   

            lastEl.click()
          },500)
        }     
      })  


      $('.spinner-container').fadeOut('fast', function(){
        $('.spinner-content').fadeTo('fast',1)
      })      
    }
  })

});