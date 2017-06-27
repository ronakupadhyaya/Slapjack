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
var _ = require('underscore');

app.engine('hbs', exphbs({
  extname: 'hbs',
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
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
  var currentPlayerUsername;
  var players = "";
  var numCards = {};

  // YOUR CODE HERE
  for (var i = 0; i < game.playerOrder.length; i++) {
    numCards[game.playerOrder[i]] = game.players[game.playerOrder[i]].pile.length;
    if (i === game.playerOrder.length - 1) {
      players += game.players[game.playerOrder[i]].username;
    } else {
      players += game.players[game.playerOrder[i]].username + ", ";
    }
  }
  if (game.isStarted) {
    currentPlayerUsername = game.players[game.playerOrder[0]].username;
  } else {
    currentPlayerUsername = 'Game has not started yet';
  }

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: players,
    cardsInDeck: game.pile.length,
    winner: winner || undefined
  }
}

io.on('connection', function(socket) {

  if (game.isStarted) {
    // whenever a player joins an already started game, he or she becomes
    // an observer automatically
    socket.emit('observeOnly');
  }
  count++;
  socket.on('disconnect', function () {
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
    if (typeof data === 'string') {
      try {
        socket.playerId = game.addPlayer(data);
        socket.emit('username', {
          id: socket.playerId,
          username: data
        });
        io.emit('updateGame', getGameState());
      } catch (err) {
        socket.emit('errorMessage', err.message);
      }
    } else {
      if (game.players[data.id]) {
        socket.playerId = data.id;
        socket.emit('username', {
         id: data.id,
         username: game.players[data.id].username
        });
        io.emit('updateGame', getGameState()); // broadcast to everyone
      } else {
        socket.emit('username', false)
      }
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
    } else {
      try {
        game.startGame();
        io.emit('start');
        io.emit('updateGame', getGameState());
      } catch(err) {
        socket.emit('errorMessage', err.message);
      }
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
    } else {
      try {
        var obj = game.playCard(socket.playerId);
        io.emit('playCard', obj);
      } catch(err) {
        socket.emit('errorMessage', err.message);
      }

      // YOUR CODE ENDS HERE
      // broadcast to everyone the game state
      io.emit('updateGame', getGameState());
    }
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    } else {
      try {
        var result = game.slap(socket.playerId);
        if (result.winning) {
          winning = game.plyers[socket.playerId].username;
        }
        if (result.message === 'got the pile!') {
          io.emit('clearDeck');
        } else if (result.message === 'lost 3 cards!') {
          if (game.players[socket.playerId].pile.length === 0) {
            var count = 0;
            for (var i = 0; i < game.playerOrder.length; i++) {
              if (game.players[game.playerOrder[i]].pile.length > 0) {
                count++;
              }
            }
            if (count === 1) {
              winner = game.plyers[socket.playerId].username;
              game.isStarted = false;
            } else {
              game.nextPlayer();
            }
          }
        }
        io.emit('updateGame', getGameState());
        socket.emit('message', result.message);
        socket.broadcast.emit('message', game.players[socket.playerId].username + ' ' + result.message);
      } catch(err) {
        socket.emit('errorMessage', err.message);
      }
    }
  });
});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
