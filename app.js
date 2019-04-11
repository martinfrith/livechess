var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');
var expressLayouts = require('express-ejs-layouts')
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ type: 'application/json' }))
app.set('views', path.join(__dirname, 'static'))
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs')
app.use(expressLayouts);

mongodb.MongoClient.connect(process.env.MONGO_URL, {useNewUrlParser: true }, function(err, database) {
  if(err) throw err

  const db = database.db(process.env.MONGO_URL.split('/').reverse()[0])

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
    res.render('games')
  });

  app.get('/:room', function (req, res) {
    res.render('game')
  });

  app.get('/live/:room', function (req, res) { 
    db.collection('games').findOneAndUpdate(
    {
      room:req.params.room
    },
    {
      "$set": {
        room:req.params.room
      }
    },{ 
      upsert: true, 
      'new': true, 
      returnOriginal:false 
    }).then(function(doc){
      res.render('live')
    })
  });

  app.post('/games', function (req, res) { 
    db.collection('games').find(req.body).toArray(function(err,docs){
      return res.json(docs)
    })   
  })

  app.post('/loadpgn', function (req, res) {
    if(!req.body.room) return res.json({ error: 1, cause: 'No room provided' })
    db.collection('games').findOneAndUpdate(
    {
      room: req.body.room
    },
    {
      "$set": req.body
    },{ upsert: true, 'new': true, returnOriginal:false }).then(function(doc){
      return res.json({ success: 1 })
    })    
  })

  io.on('connection', function(socket){ //join room on connect
    socket.on('join', function(room) {
      socket.join(room);
      console.log('user joined room: ' + room);
    });

    socket.on('move', function(move) { //move object emitter
      return db.collection('games').findOneAndUpdate(
      {
        room:move.room
      },
      {
        "$set": move
      },{ new: true }).then(function(doc){
        console.log('user moved: ' + JSON.stringify(move));
        io.emit('move', move);
      })
    });

    socket.on('data', function(data) { //move object emitter
      return db.collection('games').findOneAndUpdate(
      {
        room:data.room
      },
      {
        "$set": data
      },{ new: true }).then(function(doc){
        console.log('data updated: ' + JSON.stringify(data));
        io.emit('data', data);
      })
    });

    socket.on('undo', function() { //undo emitter
      console.log('user undo');
      io.emit('undo');
    });
  });

  var server = http.listen(process.env.PORT, function () { //run http and web socket server
    var host = server.address().address;
    var port = server.address().port;

    app.get('*', function (req, res) { 
      res.render('404')
    });

    console.log('Server listening at address ' + host + ', port ' + port);
  });
});