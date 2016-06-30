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
  console.log("IS THIS WORKNG")
  
  
  socket.emit('username', false);
  
  // Try to add a player to the game. 
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {

    try {
      var id = game.addPlayer(data);
      socket.playerId = id;
    } catch(e) {
      socket.emit('username', false);
      return console.error(e);
    }
    
  });


  // Start the game & broadcast to entire socket 
  socket.on('start', function() {
    try{
      game.startGame();
      socket.emit('start');
      socket.broadcast.emit('start');
    } catch(e) {
      socket.emit('message', "Cannot start game yet!")
      return console.log(e);
    }
    
  });
  
  
  // call game.playCard, emit the result the broadcast it 
  socket.on('playCard', function() {
    try {
      var won = game.isWinning(socket.playerId);
      if (won) {
        var message = game.players[socket.playerId].username + "just won the game!"; 
        socket.emit('message', "You just won the game!"); 
        socket.broadcast.emit('message', message );       
      }
      var resp = game.playCard(socket.playerId);
      socket.emit('playCard', resp);
      socket.broadcast.emit('playCard', resp);
    } catch(e) {
      socket.emit('message', "Not your turn yet!")
      return console.log(e);
    }

  });

  // Try to slap! Emit, broadcast, and handle errors accordingly 
  socket.on('slap', function() {
    try {
      var slap = game.slap(socket.playerId);
      if (slap.winning) {
        var message = game.players[socket.playerId].username + "just won the game!";
        console.log(message);
        socket.broadcast.emit('message', message);
      } else {
        var message = game.players[socket.playerId].username + " just " + slap.message;
        console.log(slap)
        console.log(message);
        socket.broadcast.emit('message', message );
      }
    } catch(e) {
      console.log(e);
      socket.emit('message', e);
      return console.log(e);
    }
    socket.emit('slap', slap);
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
