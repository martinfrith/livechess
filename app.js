var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mustacheExpress = require('mustache-express');

console.log(__dirname + '/static/')
//app.use(express.static(__dirname + '/static/'));
app.use(express.static(path.join(__dirname, 'static')));

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/static');

app.get('/', function (req, res) { //host client @ base url
  res.render('index.html')
});

app.get('/games', function (req, res) { 
  res.render('games.html', { gameid: req.params.gameid })
});

app.get('/live/:gameid', function (req, res) { 
  res.render('live.html', { gameid: req.params.gameid })
});

app.get('/:gameid', function (req, res) {
  res.render('game.html', { gameid: req.params.gameid })
});

app.get('*', function (req, res) { 
  res.render('404.html')
});

io.on('connection', function(socket){ //join room on connect
  socket.on('join', function(room) {
    socket.join(room);
    console.log('user joined room: ' + room);
  });
  socket.on('move', function(move) { //move object emitter
    console.log('user moved: ' + JSON.stringify(move));
    io.emit('move', move);
  });
});

var server = http.listen(3000, function () { //run http and web socket server
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at address ' + host + ', port ' + port);
});