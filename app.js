var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var mongodb = require('mongodb');
var expressLayouts = require('express-ejs-layouts')
var bodyParser = require('body-parser')
var onlinewhen = moment().utc().subtract(30, 'minutes').format()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ type: 'application/json' }))
app.set('views', path.join(__dirname, 'static'))
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs')
app.use(expressLayouts);

var gen_secret_room = function (factor){ 
  return Math.random().toString(36).substring(2, factor) + Math.random().toString(36).substring(2, factor)
}

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

  app.get('/results', function (req, res) {
    res.render('results')
  });

  app.get('/loadpgn', function (req, res) {
    res.render('loadpgn')
  })

  app.get('/start', function (req, res) {
    res.render('start')
  });

  app.get('/online', function (req, res) { 
    res.render('online')
  });

  app.get('/games', function (req, res) { 
    res.render('games')
  });

  app.get('/game-unknown', function (req, res) { 
    res.render('game-unknown')
  });

  app.get('/:room', function (req, res) {
    res.render('game')
  });

  app.post('/create/:room', function (req, res) { 
    if(!req.params.room) return res.json({'error':'not_enough_params'})
    db.collection('games').find({room:req.params.room}).toArray(function(err,doc){
      if(!doc.length){
        const secret_room = gen_secret_room(8)
        db.collection('games').findOneAndUpdate(
        {
          room:req.params.room
        },
        {
          "$set": {
            room:req.params.room,
            secret_room:secret_room
          }
        },{ 
          upsert: true, 
          'new': true, 
          returnOriginal:false 
        }).then(function(doc){
          return res.json({ status : 'success', secret_room:secret_room, room: req.params.room})
        })
      } else {
        return res.json({ status : 'danger', message : 'cannot_create_room_twice'})
      }
    })
  });

  app.get('/live/:secret_room/:room', function (req, res) { 
    if(!req.params.secret_room||!req.params.room) return res.json({status:'error',message:'not_enough_params'})
    db.collection('games').findOneAndUpdate(
    {
      room:req.params.room
    },
    {
      "$set": {
        room:req.params.room,
        secret_room:req.params.secret_room
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
    if(req.body.filter){
      req.body.filter.split('|').map(function(x){req.body[x] =  {$ne : null}});       
      delete req.body.filter
    }
    db.collection('games').find(req.body).sort({_id:-1}).toArray(function(err,docs){
      return res.json(docs)
    })   
  })

  app.post('/online', function (req, res) { 
    db.collection('games').find({updatedAt: { $gte: onlinewhen }, pgn: {$ne : null}, broadcast : 'true'}).toArray(function(err,docs){
      return res.json(docs)
    })   
  })

  app.post('/gamecount', function (req, res) { 
    db.collection('games').find(req.body).toArray(function(err,docs){
      return res.json(docs.length)
    })
  })

  app.post('/search', function (req, res) { 
    if(!req.body.query) return res.json({'error':'not_enough_params'})
    db.collection('games').find({        
      "$or": [{
          "event": {'$regex' : req.body.query, '$options' : 'i'}
      }, {
          "site": {'$regex' : req.body.query, '$options' : 'i'}
      }, {
          "white": {'$regex' : req.body.query, '$options' : 'i'}
      }, {
          "black": {'$regex' : req.body.query, '$options' : 'i'}
      }]
    }).toArray(function(err,docs){
      return res.json(docs)
    })   
  })

  app.post('/loadpgn', function (req, res) {
    if(!req.body.room) return res.json({'error':'no_room_provided'})
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
      var moveObj = move
      moveObj.updatedAt = moment().utc().format()
      return db.collection('games').findOneAndUpdate(
      {
        room:moveObj.room
      },
      {
        "$set": moveObj
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