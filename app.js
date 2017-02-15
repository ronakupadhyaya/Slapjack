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

function getGameStatus() {
  var numCards = {}
  var currentPlayerUsername
  var players = ""

  if (game.currentPlayer) {
    currentPlayerUsername = game.players[game.currentPlayer].username
  }


  for(var i = 0; i < game.playerOrder.length; i++) {
    players = players + game.players[Object.keys(game.players)[i]].username + " "
    console.log('game.players[Object.keys(game.players[i])].username',game.players[Object.keys(game.players)[i]])
    numCards[Object.keys(game.players)[i]] = game.players[Object.keys(game.players)[i]].pile.length
  }

  return {
    numCards: numCards || "You don't have cards",
    currentPlayerUsername: currentPlayerUsername || "Game has yet to begin",
    playersInGame: players,
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
      var id = game.addPlayer(data)
      socket.playerId = id;
    }
    catch(err) {
      socket.emit('username', false)
      return console.log(err)
    }
    socket.emit('username', id)
    socket.emit('updateGameStatus', getGameStatus())
    socket.broadcast.emit('updateGameStatus', getGameStatus())
  });


  // Start the game & broadcast to entire socket
  socket.on('start', function() {
    try {
      game.startGame();
    }
    catch(err) {
      return console.log(err)
    }
    socket.emit('start', {
      gameState: getGameStatus()
    });

    socket.broadcast.emit('start', {
      gameState: getGameStatus()
    });
  });


  // call game.playCard, emit the result the broadcast it
  socket.on('playCard', function() {
    try {
      var cardPlayed = game.playCard(socket.playerId)
    }
    catch(err) {
      socket.emit('message', "Not your turn dummy.")
      return console.log(err)
    }
    socket.emit('playCard', {card: cardPlayed, gameState: getGameStatus()})
    socket.broadcast.emit('playCard', {card: cardPlayed, gameState: getGameStatus()})
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly
  socket.on('slap', function() {
    try {
      var slap = game.slap(socket.playerId)
    }
    catch(err) {
      socket.emit('message', err)
      return console.log(err)
    }
    socket.emit('slap', { slap: slap, gameState: getGameStatus()});
    socket.broadcast.emit('slap', {gameState: getGameStatus()});

    if (slap.winning === true) {
      socket.broadcast.emit('message', game.players[socket.playerId].username + ' just won the game!')
    } else {
      socket.broadcast.emit('message', game.players[socket.playerId].username
        + ' ' + slap.message);
    }

    if (slap.message === "got the pile!") {
      socket.emit('clearDeck');
      socket.broadcast.emit('clearDeck');
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
