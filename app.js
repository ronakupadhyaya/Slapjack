"use strict";

var path = require('path');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
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
app.use(bodyParser.urlencoded({
  extended: true
}));
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
  var numCards = {};
  for (var i in game.playerOrder) {
    numCards[game.playerOrder[i]] = game.players[game.playerOrder[i]].pile.length;
  }
  var currentPlayerUsername = game.players[game.currentPlayer].username;
  var playersInGame = [];
  for (var i in game.playerOrder) {
    playersInGame.push(game.players[game.playerOrder[i]].username);
  }
  playersInGame = playersInGame.join(' ');
  var cardsInDeck = game.pile.length;
  if (cardsInDeck > 0) {
    var lastCard = game.pile[game.pile.length - 1].toString();
  } else {
    var lastCard = '';
  }

  return {
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: playersInGame,
    cardsInDeck: cardsInDeck,
    lastCard: lastCard,
  }
}

io.on('connection', function(socket) {

  socket.emit('username', false);

  // Try to add a player to the game.
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {
    console.log(data);
    try {
      if (typeof data == 'string') {
        var id = game.addPlayer(data);
        socket.playerId = id;
        socket.emit('username', id);
        socket.emit('updateGame', getGameStatus());
        socket.broadcast.emit('updateGame', getGameStatus());
      } else {
        if (game.playerOrder.indexOf(data.id) == -1) {
          socket.emit('newUser');
        } else {
          socket.playerId = data.id;
          if (game.isStarted) {
            socket.emit('start');
          }
          socket.emit('updateGame', getGameStatus());
          socket.broadcast.emit('updateGame', getGameStatus());
        }
      }
    } catch (err) {
      console.log(err);
      socket.emit('username', false);
    }
  });


  // Start the game & broadcast to entire socket
  socket.on('start', function() {
    try {
      game.startGame();
      socket.emit('start');
      socket.broadcast.emit('start');
      socket.emit('updateGame', getGameStatus());
      socket.broadcast.emit('updateGame', getGameStatus());
    } catch (err) {
      socket.emit('message', 'Cannot start game yet!');
    }
  });


  // call game.playCard, emit the result the broadcast it
  socket.on('playCard', function() {
    try {
      var card = game.playCard(socket.playerId);
      socket.emit('playCard', card);
      socket.broadcast.emit('playCard', card);
      socket.emit('updateGame', getGameStatus());
      socket.broadcast.emit('updateGame', getGameStatus());
    } catch (err) {
      socket.emit('Not your turn yet');
    }
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly
  socket.on('slap', function() {
    try {
      var slapResult = game.slap(socket.playerId);
      socket.emit('slap', slapResult);
      if (slapResult.winning) {
        socket.broadcast.emit('message', slapResult.username + ' just won the game!');
      } else {
        socket.broadcast.emit('message', slapResult.username + ' just ' + slapResult.message);
      }
      socket.emit('updateGame', getGameStatus());
      socket.broadcast.emit('updateGame', getGameStatus());
    } catch (err) {
      socket.emit('message', 'Cannot slap rn');
    }
  });

  socket.on('updateGame', function() {

  });

});

var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('Express started. Listening on %s', port);
});
