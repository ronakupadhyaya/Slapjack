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
    var user = game.addPlayer(data)
    if (user) {
      socket.playerId = user;
      socket.emit('username', user);
    } else {
      socket.emit('username', false);
      return;
    }
  });


  // Start the game & broadcast to entire socket 
  socket.on('start', function() {
    try {
      game.startGame();
      socket.broadcast.emit('start', "starting");
    } catch(expection) {
      socket.emit('message', "Cannot start game yet!");
    }
  });
  
  
  // call game.playCard, emit the result the broadcast it 
  socket.on('playCard', function() {
    var play = game.playCard(socket.playerId); 
    if (!play) {
      socket.emit("message", 'Not your turn yet');

    } else {
      socket.broadcasts.emit('playCard', play);
    }
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly 
  socket.on('slap', function() {
    var slap = game.slap(socket.playerId);
    if (!slap) {
      socket.emit('message', 'error');
    } else {
      socket.emit('slap', slap);
      if ([slap].winning) {
        socket.broadcast.emit('message', game.players[socket.playerId].username + "just won the game!");
      } else {
        socket.broadcast.emit('message', game.players[socket.playerId].username + [slap].message);
      }
      
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
