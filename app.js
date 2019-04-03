var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mustacheExpress = require('mustache-express');
var mongodb = require('mongodb');

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;

//app.use(express.static(__dirname + '/static/'));
app.use(express.static(path.join(__dirname, 'static')));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/static');

mongodb.MongoClient.connect(uri, function(err, database) {
  const db = database.db('livechess')

  app.get('/', function (req, res) { //host client @ base url
    res.render('index.html')
  });

  app.get('/games', function (req, res) { 
    db.collection('games').find().then(function(docs){
      res.render('games.html', 
      { 
        data: JSON.stringify(docs.value) 
      })
    })
  });

  app.get('/live/:gameid', function (req, res) { 
    db.collection('games').findOneAndUpdate(
    {
      id:req.params.gameid
    },
    {
      "$set": {
        id:req.params.gameid
      }
    },{ upsert: true, 'new': true, returnOriginal:false }).then(function(doc){
      console.log(doc)
      res.render('live.html', { data: JSON.stringify(doc.value) })
    })
  });

  app.get('/:gameid', function (req, res) {
    db.collection('games').findOne(
    {
      id:req.params.gameid
    }, function(err, doc) {
      if (err) throw err;
      console.log(doc)
      res.render('game.html', { data: JSON.stringify(doc) })
    })
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
      return db.collection('games').findOneAndUpdate(
      {
        id:move.room
      },
      {
        "$set": {
          fen:move.fen,
          pgn:move.pgn,
          turn:move.turn
        }
      },{ new: true }).then(function(doc){
        console.log('user moved: ' + JSON.stringify(move));
        io.emit('move', move);
      })
    });

    socket.on('undo', function() { //undo emitter
      console.log('user undo:');
      io.emit('undo');
    });
  });

  var server = http.listen(3000, function () { //run http and web socket server
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server listening at address ' + host + ', port ' + port);
  });
});