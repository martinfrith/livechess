$(document).ready(function() {


  var socket = io();  
  var board,
    room = location.pathname.replace('/live/',''),
    data = {},  
    synced = false,
    game = new Chess(),
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn')

  // do not pick up pieces if the game is over
  // only pick up pieces for the side to move
  var onDragStart = function(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
  };

  var onDrop = function(source, target) {
      //move object
      var moveObj = ({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
      });
      console.log('own move: ' + JSON.stringify(moveObj));
      // see if the move is legal
      var move = game.move(moveObj);
      // illegal move
      if (move === null) {
        return 'snapback';
      }
      moveObj.room = room;
      moveObj.fen = game.fen();
      moveObj.pgn = game.pgn();
      moveObj.turn = game.turn();
      socket.emit('move',  moveObj);
      updateStatus();
  };

  // update the board position after the piece snap 
  // for castling, en passant, pawn promotion
  var onSnapEnd = function() {
    board.position(game.fen());
  };

  var updateStatus = function() {
    var status = '';
    var moveColor = 'Blancas';
    var turn = game.turn()
    var pgn = game.pgn()

    if(!synced && data.turn){
      turn = data.turn
      pgn = data.pgn
    } 

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
    pgnEl.html(pgn);

    synced = true
  };


  //initiated socket client
  socket.emit('join',room);  //join room as defined by query parameter in URL bar

  socket.on('undo', function(){ //remote undo by peer
    game.undo()
    updateStatus();
    board.position(game.fen());
  })

  socket.on('data', function(dataObj){ //remote move by peer
    $('#updatebtn').prop('disabled',false).removeClass('is-loading')
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

  $.ajax({
    url:'/games',
    method:'POST',
    data: {room:room},
    success:function(res){
      const match = res[0]
      data = match;
      data.watch_url = location.href.replace('live/','')

      $('.panel').html($.templates("#match").render(match)).promise().done(function (){

        var pos = 'start';
        if(data && data.fen){
          pos = data.fen
        }

        if(data.pgn){
          game.load_pgn(data.pgn)
        }

        var cfg = {
          draggable: true,
          position: pos,
          onDragStart: onDragStart,
          onDrop: onDrop,
          onSnapEnd: onSnapEnd
        };

        board = ChessBoard('board', cfg);

        updateStatus(); 

        var loadpgnEl = $('#loadpgn'),
        undoEl = $('#undo'),
        flipEl = $('#flip')

        loadpgnEl.submit(function(){
          $('#updatebtn').prop('disabled',true).addClass('is-loading')
          var data = {};
          $(this).serializeArray().map(function(x){data[x.name] = x.value;});       
          socket.emit('data',  data);
          /*
          $.ajax({
            url:'/loadpgn',
            method:'POST',  
            data: data,
            success:function(res){
              $('#updatebtn').prop('disabled',false).removeClass('is-loading')
            }
          })*/      
          return false
        })

        undoEl.click(function(){
          socket.emit('undo')
        })

        flipEl.click(function(){
          board.flip()
        })    


        $(window).on('hashchange', function(){
          if(location.hash.indexOf('info') > -1) {
            $('.panel > .inner-panel > .columns > .column').hide()
            $('.panel, .panel-info').show()
          }
          if(location.hash.indexOf('action') > -1) {
            $('.panel > .inner-panel > .columns > .column').hide()
            $('.panel, .panel-action').show()
          }
          if(location.hash===''){
            $('.panel').hide() 
          }
        }).trigger('hashchange')

        $('.spinner-container').fadeOut('fast', function(){
          $('.spinner-content').fadeTo('fast',1)
        })
      })
    }
  })
})