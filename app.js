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

var getGameStatus = function() {
  var poo = {};
  for (var key in game.players) {
    if (!poo[key]) {
      poo[key] = game.players[key].pile.length;
    }
  }
  var allNames = [];
  for (var key in game.players) {
    allNames.push(game.players[key].username);
  }
  allNames = allNames.join();
  return {
    numCards: poo,
    currentPlayerUsername: game.players[game.currentPlayer].username,
    playersInGame: allNames,
    cardsInDeck: game.pile.length
  }
}

io.on('connection', function(socket){
  
  
  socket.emit('username', false);
  
  // Try to add a player to the game. 
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {
    try {
      var newPlayer = game.addPlayer(data);
    }
    catch (error) {
      socket.emit('username', false)
      return console.log(error);
    }
    socket.playerId = newPlayer;
    socket.emit('username', socket.playerId);
    if (game.isStarted) {
      socket.emit('updateGame', getGameStatus());
      socket.broadcast.emit('updateGame', getGameStatus());
    }
  });


  // Start the game & broadcast to entire socket 
  socket.on('start', function() {
    try {
      game.startGame();
    }
    catch (error) {
      socket.emit('message', "Cannot start game yet!");
      return console.log(error);
    }
    socket.emit('start');
    socket.broadcast.emit('start');
  });
  
  
  // call game.playCard, emit the result the broadcast it 
  socket.on('playCard', function() {
    try {
      var cardPlayed = game.playCard(socket.playerId);
    }
    catch (error) {
      socket.emit('message', "Not your turn yet!");
      return console.log(error);
    }
    socket.emit('playCard', cardPlayed);
    socket.broadcast.emit('playCard', cardPlayed);
    socket.emit('updateGame', getGameStatus());
    socket.broadcast.emit('updateGame', getGameStatus());
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly 
  socket.on('slap', function() {
    try {
      var cardSlap = game.slap(socket.playerId);
    }
    catch (error) {
      socket.emit('message');
      return console.log(error);
    }
    if (cardSlap.winning) {
      socket.emit('slap', game.players[socket.playerId].username + " just won");
      socket.broadcast.emit('slap', game.players[socket.playerId].username + " just won");
      socket.broadcast.emit('message', game.players[socket.playerId].username + " just won");
      return;
    }
    socket.emit('slap', game.players[socket.playerId].username + " just " + cardSlap.message);
    socket.broadcast.emit('slap', game.players[socket.playerId].username + " just " + cardSlap.message);
    socket.broadcast.emit('message', game.players[socket.playerId].username + " just " + cardSlap.message);
    if (game.pile.length > 0) {
      socket.emit('playCard', game.pile[game.pile.length - 1].toString());
      socket.broadcast.emit('playCard', game.pile[game.pile.length - 1].toString());
    } else {
      socket.emit('playCard');
      socket.broadcast.emit('playCard');
    }
    socket.emit('updateGame', getGameStatus());
    socket.broadcast.emit('updateGame', getGameStatus());
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
