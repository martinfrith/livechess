var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');
var expressLayouts = require('express-ejs-layouts')
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ type: 'application/json' }))

app.set('views', path.join(__dirname, 'static'))
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs')
app.use(expressLayouts);

mongodb.MongoClient.connect(uri, function(err, database) {
  const db = database.db('livechess')

  app.get('/', function (req, res) {
    res.render('index')
  });

  app.get('/about', function (req, res) {
    res.render('about')
  });

  app.get('/contact', function (req, res) {
    res.render('contact')
  });

  app.get('/search', function (req, res) {
    res.render('search')
  });

  app.get('/loadpgn', function (req, res) {
    res.render('loadpgn')
  })

  app.get('/games', function (req, res) { 
    db.collection('games').find({}).toArray(function(err,docs){
      res.render('games', 
      { 
        data: docs
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
      res.render('live', { data: doc.value })
    })
  });

  app.get('/:gameid', function (req, res) {
    db.collection('games').findOne(
    {
      id:req.params.gameid
    }, function(err, doc) {
      if (err) throw err;
      if (!doc) return res.render('404')
      res.render('game', { data: doc })
    })
  });

  app.get('/import', function (req, res) {
    if(req.files){
      req.files.forEach(function(file){
        if(file && file.size > 0){
        }        
      })
    }
  });

  app.post('/loadpgn', function (req, res) {
    if(!req.body.gameid) return false
    db.collection('games').findOneAndUpdate(
    {
      id: req.body.gameid
    },
    {
      "$set": req.body
    },{ upsert: true, 'new': true, returnOriginal:false }).then(function(doc){
      return res.json({ success: 1 })
    })    
  })

  app.get('*', function (req, res) { 
    res.render('404')
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