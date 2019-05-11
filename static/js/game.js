var board,
boardEl = $('#board'),
game = new Chess(),
room = location.pathname.replace('/',''),
squareClass = 'square-55d63',
squareToHighlight,
paused = false,
speed = 2000,
colorToHighlight,
possibleMoves = [],
index = 0,
makeMove = function() {

  if(!paused){
    // exit if the game is over
    if (game.game_over() === true ||
      game.in_draw() === true ||
      possibleMoves.length === 0) return;

    var move = possibleMoves[index];
    square = move.replace(/[A-Z]/,"")

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

    var perc = index / possibleMoves.length * 100;
    $('.gamebar-progress').animate({width:perc+'%'},speed,'linear')

    console.log("move:" + move)

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
          })
        })
      })
    }
  })
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
  board.flip()
  var head = $('.boardhead').html(),
  foot = $('.boardfoot').html()
  $('.boardhead').html(foot)
  $('.boardfoot').html(head)
})
$(document).on('click','.gamebar', () => {
  paused = !paused
  $('.gamebar-progress').removeClass('paused')
  if(paused){
    $('.gamebar-progress').addClass('paused')
  } else {
    window.setTimeout(makeMove, 500)
  }
})
loadgame()