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
    socket.emit('move', moveObj);
    updateStatus();
};


$(document).ready(function() {
	//the example code goes here
	var socket = io();                                  //initiated socket client
	socket.emit('join', getParameterByName('gameid'));  //join room as defined by query parameter in URL bar

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
});