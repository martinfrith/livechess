var board,
room = location.pathname.replace('/',''),
selectedIndex = parseInt(location.hash.replace('#','')),
boardEl = $('#board'),
game = new Chess(),
index = 0,
paused = false,
speed = 2500,
squareClass = 'square-55d63',
possibleMoves = [],
gameMove = () => {
  if(!paused){
    var move = possibleMoves[index];
    selectedIndex = parseInt(location.hash.replace('#',''))

    boardEl.find('.square-55d63').removeClass('highlight-move');

    // exit if the game is over
    if (!move || game.game_over() === true ||
      game.in_draw() === true ||
      possibleMoves.length === 0) return;

    var square = move.replace(/[^\w\s]/gi,'')
    square = square.substr(-2)

    $('.moveindex').removeClass('active')
    $('.moveindex[href="#' + index + '"]').addClass('active')

    var perc = (index + 1) / possibleMoves.length * 100;
    $('.bar-progress').animate({width:perc+'%'},speed,'linear')
    index++
    var moved = game.move(move);
    board.position(game.fen());  

    if(moved) {
      document.querySelector('.square-' + moved.from).classList.add('highlight-move')
      document.querySelector('.square-' + moved.to).classList.add('highlight-move')      
    }

    if(index === possibleMoves.length){
      gamePause()
    } else {
      window.setTimeout(gameMove, speed);
    }
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
gameStart = () => {
  if(localStorage.getItem('speed')){
    speed = parseInt(localStorage.getItem('speed'))
  }
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
            $(window).resize(board.resize);
            board.resize()
            window.setTimeout(gameSeek, 500);
            $('#speed').text(speed/1000+'s')
            $('.moreinfo').delay(1000).fadeIn('fast', () => {
              $('.boardhead, .boardfoot').fadeTo('fast',1)
            })
          })
        })
      })
    }
  })
},
gameFlip = () => {
  board.flip()
  var head = $('.b-head').html()
  var foot = $('.b-foot').html()
  $('.b-head').html(foot)
  $('.b-foot').html(head)
},
gameSeek = () => {
  window.setTimeout(() => {

    selectedIndex = parseInt(location.hash.replace('#',''))
    $('.moveindex').removeClass('active')
    $('.moveindex[href="#' + selectedIndex + '"]').addClass('active')

    if(!isNaN(selectedIndex)) {
      gamePos(selectedIndex)
      $('.moreinfo').show()
    }
    gameMove()
    if(!isNaN(selectedIndex) && !paused) {
      gamePause()
    }
  }, 500);
},
gamePos = (pos) => {
  boardEl.find('.square-55d63').removeClass('highlight-move');
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
    window.setTimeout(gameMove, 500)
  }
},
gameSpeed = (s) => {
  speed+= s
  if(speed >= 1000 && speed <= 10000){
    $('#speed').text(speed/1000+'s')
    localStorage.setItem('speed',speed)
  } else {
    speed-=s
  }
},
gameScroll = (e) => {
  if($('body').scrollTop() > 10) {
    if(!paused){
      gamePause()
    }
  } else {
    if(paused){
      gamePause()
    }
  }
},
cfg = {
  showErrors:true,
  position: 'start',
  draggable: false
  //onMoveEnd: onMoveEnd
}
/**/
$(document).ready(function() {
  $(document).on('click','.showmore', (e) => {
    e.preventDefault()
    $($(e.target).attr('toggle')).slideToggle()
    setTimeout(function() {
      var body = $("html, body");
      body.stop().animate({scrollTop:$(document).height()}, 250, 'swing', function() { 
      });
    }, 10)

  })
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
      gameSpeed(200)
      //gamePos(possibleMoves.length -1)
    } else if(e.keyCode == 39){
      if(index <= possibleMoves.length){
        gamePos(index+1)
      }
    } else if(e.keyCode == 40){
      gameSpeed(-200)
      //gamePos(0)
    } else if(e.keyCode == 32){
      gamePause()
    } else if(e.shiftKey && e.keyCode == 70){
      gameFlip()
    }
  })
  //$('body').on('scroll', gameScroll)
  $(window).on('hashchange', gameSeek)
  gameStart()
})
