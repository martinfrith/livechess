const fs = require('fs')
var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var mongodb = require('mongodb');
var expressLayouts = require('express-ejs-layouts')
var bodyParser = require('body-parser')
var onlinewhen = moment().utc().subtract(10, 'minutes')
var gamesort = {views:-1}

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
            secret_room:secret_room,
            date:moment().utc().format('YYYY.MM.DD'),
            event: 'Online game',
            views: 1
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

  app.get('/live/:secret/:room', function (req, res) { 
    if(!req.params.secret||!req.params.room) return res.json({status:'error',message:'not_enough_params'})
    db.collection('games').findOneAndUpdate(
    {
      room:req.params.room
    },
    {
      "$set": {
        room:req.params.room,
        secret_room:req.params.secret
      }
    },{ 
      upsert: true, 
      'new': true, 
      returnOriginal:false 
    }).then(function(){
      res.render('live')
    })
  });

  app.post('/games', function (req, res) { 
    if(req.body.filter){
      req.body.filter.split('|').map(function(x){
        if(x==='puzzles'){
          req.body["result"] = ""
        } else {
          req.body[x] = { "$regex": /^.{1,}$/ }
        }
      });       
      delete req.body.filter
    }

    db.collection('games').find(req.body).sort(gamesort).toArray(function(err,docs){
      if(docs){
        docs.forEach(function(doc){ // hide security data
          delete doc.secret_room 
          delete doc.live_url 
        })
      }
      return res.json(docs)
    })   
  })

  app.post('/secretgames', function (req, res) { 
    if(req.body.filter){
      req.body.filter.split('|').map(function(x){req.body[x] =  {$ne : null}});       
      delete req.body.filter
    }
    db.collection('games').find(req.body).sort(gamesort).toArray(function(err,docs){
      return res.json(docs)
    })   
  })

  app.post('/online', function (req, res) { 
    db.collection('games').find({updatedAt: { $gte: onlinewhen.format() }, pgn: {$ne : null}, broadcast : 'true'}).toArray(function(err,docs){
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
    var $or = []
    , limit = parseInt(req.body.limit)||10
    , offset = parseInt(req.body.offset)||0
    req.body.query.split(' ').forEach((w) => {
      $or.push({"event": {'$regex' : w, '$options' : 'i'}})
      $or.push({"site": {'$regex' : w, '$options' : 'i'}})
      $or.push({"date": {'$regex' : w, '$options' : 'i'}})
      $or.push({"white": {'$regex' : w, '$options' : 'i'}})
      $or.push({"black": {'$regex' : w, '$options' : 'i'}})
    })
    db.collection('games').countDocuments({"$or": $or}, function(error, numOfDocs){
      db.collection('games').find({"$or": $or})
        .sort(gamesort)
        .limit(limit)
        .skip(offset)
        .toArray(function(err,docs){
          return res.json({games:docs,count:numOfDocs})
        })   
    })
  })

  //.sort( { name: 1 } )

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

  app.get('*', function (req, res) { 
    const pathurl = [path.join(__dirname, 'static'),req.path+'.ejs'].join('')
    const pathname = req.path.split('/').join('')
    const query = req.query
    fs.stat(pathurl, function(err, stat) {
      if(err == null) {
        res.render(pathname,{query: query})
      } else {
        db.collection('games').findOneAndUpdate(
        {
          room:pathname
        },
        {
          "$inc": {
            views : 1
          }
        },{ upsert: false, new: true }).then(function(doc){
          if(doc.value){
            if(doc.value.updatedAt && doc.value.broadcast && moment(doc.value.updatedAt).format('x') > onlinewhen.format('x')) {
              res.render('watch',{game:doc.value})
            } else {
              res.render('game',{game:doc.value})
            }
          } else {
            res.render('404')
          }
        })
      }
    });
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
        console.log(moveObj.room + '- user moved: ' + JSON.stringify(move));
        io.emit('move', move);
      })
    });

    socket.on('data', function(data) { //move object emitter
      var dataObj = data
      dataObj.updatedAt = moment().utc().format()      
      return db.collection('games').findOneAndUpdate(
      {
        room:data.room
      },
      {
        "$set": dataObj
      },{ new: true }).then(function(doc){
        console.log(dataObj.room + '- data updated: ' + JSON.stringify(data));
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
    console.log('Server listening at address ' + host + ', port ' + port);
  });
});