$(document).ready(function() {

  var socket = io();  
  var board,
    boardEl = $('#board'),
    room = location.pathname.replace('/live/','').split('/')[1],
    secret_room = location.pathname.replace('/live/','').split('/')[0],
    data = {},  
    game = new Chess(),
    loaded = false,
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn')

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

      moveObj.secret_room = secret_room;
      moveObj.room = room;
      moveObj.fen = game.fen();
      moveObj.pgn = game.pgn();
      moveObj.turn = game.turn();
      moveObj.from = source;
      moveObj.to = target;
      socket.emit('move', moveObj);
      socket.emit('data', {room:room,pgn:moveObj.pgn});
      updateStatus(moveObj);
  };

  // update the board position after the piece snap 
  // for castling, en passant, pawn promotion
  var onSnapEnd = function() {
    board.position(game.fen());
  };

  var updateStatus = function(move) {
    var status = '';
    var moveColor = 'Blancas';
    var turn = game.turn()
    var pgn = game.pgn()

    if (turn === 'b') {
      moveColor = 'Negras';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
      socket.emit('data', {room:room,result:(moveColor==='Blancas'?'0-1':'1-0')});
      status = 'Juego finalizado. ' + moveColor + ' en jaquemate.';
    }

    // draw?
    else if (game.in_draw() === true) {
      socket.emit('data', {room:room,result:'1/2-1/2'});
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

    if(loaded){
      playAudio()
    }
    statusEl.html(status);
    //fenEl.html(game.fen());
    pgnEl.html(pgn);

    // mark last move
    addHightlights(move)

    loaded = true

  };

  //initiated socket client
  socket.emit('join',room);  //join room as defined by query parameter in URL bar

  socket.on('undo', function(){ 
    game.undo()
    updateStatus();
    board.position(game.fen());
  })

  socket.on('data', function(dataObj){
    var broadcast = $('input[name="broadcast"]').is(':checked')?1:0
    if(dataObj.pgn) $('textarea[name="pgn"]').val(dataObj.pgn)
    $('#watch_url').css({opacity:broadcast})
    $('#updatebtn').prop('disabled',false).removeClass('is-loading')
    $('.is-loading').removeClass('is-loading').addClass('is-active')
  })

  socket.on('move', function(moveObj){
    console.log('peer move: ' + JSON.stringify(moveObj))
    var move = game.move(moveObj)

    // illegal move
    if (move === null) {
      return;
    }

    updateStatus(move)
    board.position(game.fen())
  });

  $.ajax({
    url:'/secretgames',
    method:'POST',
    data: {secret_room:secret_room},
    success:function(res){
      const match = res[0]
      data = match
      data.watch_url = [window.location.protocol,'',window.location.host,room].join('/')
      data.live_url = location.href.split('#')[0]

      $('.panel').html($.templates("#match").render(match)).promise().done(function (){
        
        var pos = 'start'

        if(data.fen){
          pos = data.fen
        }

        var cfg = {
          draggable: true,
          position: pos,
          onDragStart: onDragStart,
          onDrop: onDrop,
          onSnapEnd: onSnapEnd
        };

        if(data.pgn){
          game.load_pgn(data.pgn)
        }

        board = ChessBoard('board', cfg);
        board.position(game.fen())
        updateStatus(data);
        
        var loadpgnEl = $('#loadpgn'),
        undoEl = $('#undo'),
        flipEl = $('#flip'),
        wwinsEl = $('#wwins'),
        bwinsEl = $('#bwins'),
        drawEl = $('#draw'),
        broadcastEl = $('#broadcast'),
        updateclosebtnEl = $('#updateclosebtn')

        loadpgnEl.submit(function(){
          $('#updatebtn').prop('disabled',true).addClass('is-loading')
          var data = {};
          $(this).serializeArray().map(function(x){data[x.name] = x.value;});       
          data.broadcast = $('input[name="broadcast"]').is(':checked')?'true':'false'
          socket.emit('data',  data);
          return false
        })

        wwinsEl.click(function(){
          $(this).parent().find('.button').removeClass('is-active')
          $(this).addClass('is-loading')
          socket.emit('data', {room:room,result:'1-0'});
        })

        bwinsEl.click(function(){
          $(this).parent().find('.button').removeClass('is-active')
          $(this).addClass('is-loading')
          socket.emit('data', {room:room,result:'0-1'});
        })

        drawEl.click(function(){
          $(this).parent().find('.button').removeClass('is-active')
          $(this).addClass('is-loading')
          socket.emit('data', {room:room,result:'1/2-1/2'});
        })

        updateclosebtnEl.click(function(){
          var data = {};
          $("#loadpgn").serializeArray().map(function(x){data[x.name] = x.value;});       
          data.broadcast = $('input[name="broadcast"]').is(':checked')?'true':'false'
          socket.emit('data',  data)
          location.hash = ''
        })

        broadcastEl.click(function(){
          var data = {};
          data.room = room
          data.broadcast = $('input[name="broadcast"]').is(':checked')?'true':'false'
          socket.emit('data',data)
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
          $('.spinner-content').fadeTo('slow',1)
        })
      })
    }
  })
})