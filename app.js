"use strict";

var path = require('path');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var exphbs  = require('express-handlebars');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.engine('hbs', exphbs({
  extname: 'hbs',
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('combined'));

app.get('/', function(req, res) {
  res.render('index');
});

// Here is your new Game!
var Game = require('./game');
var game = new Game();

io.on('connection', function(socket){
  
  
  socket.emit('username', false);
  
  // Try to add a player to the game. 
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {
    try {
     var id = game.addPlayer(data)
      socket.emit('username',id)
    } catch(e) {
      socket.emit('username',false)
    }
    
  });

  //socket.broadcast.emit : will send to everyone but current user
  //library= socket io
  //socket: connection between server and client
  //index.hbs= server side (client action)
  //app.js= client side (server receives)

  //socket.emit on index.hbs: click handler on start

  ///ssend theevents and need to create the listeners
  //both server and browser sending and receiving events so have to listen on both sides
  //.broadcat: send to everyone but the one who initiates the evetn
  //emit: message only sent to initiator
  // will need to update others of user's move
  //run tests with npm test (after npm install)

  // Start the game & broadcast to entire socket 
  socket.on('start', function() {
    //console.log('received')
    try{
      var start = game.startGame()
      console.log('start')
      socket.broadcast.emit('start',start)
    }
    catch(e){
      console.log('err')
      socket.broadcast.emit('start',false)
    }
    
  });
  
  
  // call game.playCard, emit the result the broadcast it 
  socket.on('playCard', function() {

  });

  // Try to slap! Emit, broadcast, and handle errors accordingly 
  socket.on('slap', function() {
    
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
