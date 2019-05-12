var board,
room = location.pathname.replace('/',''),
boardEl = $('#board'),
game = new Chess(),
index = 0,
paused = false,
speed = 2500,
squareToHighlight,
colorToHighlight,
squareClass = 'square-55d63',
possibleMoves = [],
makeMove = () => {

  if(!paused){
    // exit if the game is over

    var move = possibleMoves[index];

    if (!move || game.game_over() === true ||
      game.in_draw() === true ||
      possibleMoves.length === 0) return;

    var square = move.replace(/[^\w\s]/gi,'')
    square = square.substr(-2)

    if (index%2===0) {
      boardEl.find('.' + squareClass).removeClass('highlight-white');
      //boardEl.find('.square-' + possibleMoves[index-1]).addClass('highlight-white');
      squareToHighlight = square;
      colorToHighlight = 'white';
    }
    else {
      boardEl.find('.square-55d63').removeClass('highlight-black');
      //boardEl.find('.square-' + possibleMoves[index-1]).addClass('highlight-black');
      squareToHighlight = square;
      colorToHighlight = 'black';    
    }

    var perc = (index + 1) / possibleMoves.length * 100;
    $('.bar-progress').animate({width:perc+'%'},speed,'linear')

    console.log(index + ":" + move)
    index++
    game.move(move);
    board.position(game.fen());

    window.setTimeout(makeMove, speed);
  }
},
gamePGN = (pgn) => {
  var data = []
  pgn.split('.').forEach(function(turn){
    turn.split(' ').forEach(function(move){
      if(move.length){
        if(isNaN(move) && move.length > 1){
          data.push(move)
        }
      }
    })
  })
  return data
},
loadgame = () => {
  $.ajax({
    url:'/games',
    method:'POST',
    data: {room:room,filter:'pgn'},
    success:function(res){
      if(!res.length) return location.href="/404"
      var game = res[0]
      possibleMoves = gamePGN(game.pgn)
      $('.game-container').html($.templates("#game").render(game,parseHelpers)).promise().done(() => {
        $('.spinner-container').fadeOut('fast', () => {
          $('.spinner-content').fadeTo('slow',1, () => {
            board = ChessBoard('board', cfg);
            boardEl = $('#board')
            window.setTimeout(makeMove, 500);
            $('#speed').text(speed)
          })
        })
      })
    }
  })
},
gameFlip = () => {
  board.flip()
  var head = $('.boardhead').html(),
  foot = $('.boardfoot').html()
  $('.boardhead').html(foot)
  $('.boardfoot').html(head)
},
gamePos = (pos) => {
  game.reset();
  possibleMoves.forEach((move,i) => {
    if(i < pos){
      game.move(move)
    }
  })
  index = pos
},
gamePause = () => {
  paused = !paused
  $('.bar-progress').removeClass('paused')
  if(paused){
    $('.bar-progress').addClass('paused')
  } else {
    window.setTimeout(makeMove, 500)
  }
},
onMoveEnd = function() {
  boardEl.find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight);
},
cfg = {
  position: 'start',
  onMoveEnd: onMoveEnd
}
/**/
$(document).on('click','.game-container', () => {
  gamePause()
})
$(document).on('click','#board', () => {
  gameFlip()
})
$(document).on('click','.bar', (e) => {
    var x = e.pageX - e.target.offsetLeft
    var w = $(document).width()
    var pos = parseInt(x / w * possibleMoves.length)
    gamePos(pos)
})
$(document).keydown(function(e) {
  if(e.keyCode == 37){
    if(index){
      gamePos(index-1)
    }
  } else if(e.keyCode == 38){
    if(speed < 10000){
      speed+= 100
    }
    $('#speed').text(speed)
    //gamePos(possibleMoves.length -1)
  } else if(e.keyCode == 39){
    if(index <= possibleMoves.length){
      gamePos(index+1)
    }
  } else if(e.keyCode == 40){
    if(speed > 1000){
      speed-= 100
    }
    $('#speed').text(speed)
    //gamePos(0)
  } else if(e.keyCode == 32){
    gamePause()
  } else if(e.keyCode == 70){
    gameFlip()
  }
});

loadgame()