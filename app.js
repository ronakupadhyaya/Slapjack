"use strict";

/*********** SERVER SIDE ****************/
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
var _ = require('underscore');

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
app.use(morgan('tiny'));

app.get('/', function(req, res) {
  res.render('index');
});

// Here is your new Game!
var Card = require('./card');
var Player = require('./player');
var Game = require('./game');
var game = new Game();
var count = 0; // Number of active socket connections
var winner = null; // Username of winner

function getGameState() {
  var currentPlayerUsername = "Game has not started yet";
  var players = "";
  var numCards = {};
  var id = game.playerOrder[0];
  // YOUR CODE HERE
  Object.keys(game.players).forEach(function(key) {
    var player = game.players[key];
    numCards[key] = player.pile.length;
    players += player.username + "\n";
  });

  if (game.isStarted) {
    currentPlayerUsername = game.players[id];
  }
  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: game.players[id].username,
    playersInGame: players,
    cardsInDeck: game.pile.length,
    win: winner
  }
}

io.on('connection', function(socket) {

  if (game.isStarted) {
    // whenever a player joins an already started game, he or she becomes
    // an observer automatically
    socket.emit('observeOnly');
  }
  count++;
  socket.on('disconnect', function() {
    count--;
    if (count === 0) {
      game = new Game();
      winner = null;
    }
  });

  socket.on('username', function(data) {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    //try to create a player
    try {
      if (typeof data === 'string') {
        socket.playerId = game.addPlayer(data);
        socket.emit('username', {
          id: socket.playerId,
          username: data
        });
      } else {
        if (game.players[data.id]) {
          socket.playerId = data.id;
          socket.emit('username', {
            id: data.id,
            username: game.players[data.id].username
          });
        } else {
          socket.emit('username', false);
        }
      }
      io.emit('updateGame', getGameState());
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }
    try {
      game.startGame();
      io.emit('start');
      io.emit('updateGame', getGameState());
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }
    try {
      io.emit('playCard', game.playCard(socket.playerId));
      var player = game.players[socket.playerId];
      if (player.pile.length === 0) {
        var count = 0;
        var playerName = "";
        Object.keys(game.players).forEach(function(key) {
          var player = game.players[key];
          if (player.pile.length > 0) {
            count++;
            playerName = player.username;
          }
        });
        if (count === 1) {
          winner = playerName;
          game.isStarted = false;
        }
      }
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }
    try {
      var slapObject = game.slap(socket.playerId);
      if (slapObject.winning) {
        winner = game.players[socket.playerId].username;
      }
      if (slapObject.message === 'got the pile!') {
        io.emit('clearDeck');
      }
      var player = game.players[socket.playerId];
      if (player.pile.length === 0) {
        var count = 0;
        var playerName = "";
        Object.keys(game.players).forEach(function(key) {
          var player = game.players[key];
          if (player.pile.length > 0) {
            count++;
            playerName = player.username;
          }
        });
        if (count === 1) {
          winner = playerName;
          game.isStarted = false;
        }
      }
      io.emit('updateGame', getGameState());
      socket.emit('message', "You " + slapObject.message)
      socket.broadcast.emit('message', player.username + " " + slapObject.message);
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }

  });

});

var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('Express started. Listening on %s', port);
});
