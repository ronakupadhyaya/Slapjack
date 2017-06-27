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

app.get('/', function (req, res) {
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
  var numCards = {};
  var playersInGame = [];
  for (var i in game.players) {
    numCards[i] = game.players[i].pile.length;
    playersInGame.push(game.players[i].username);
  }
  var currentPlayerUsername;
  if (game.isStarted) {
    currentPlayerUsername = game.players[game.playerOrder[0]].username;
  } else {
    currentPlayerUsername = "Game has not yet started";
  }
  playersInGame = playersInGame.join(',');
  var win;
  if (winner) win = winner;
  else win = undefined;

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: playersInGame,
    cardsInDeck: game.pile.length,
    win: win
  }
}

io.on('connection', function (socket) {

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

  socket.on('username', function (data) {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    try {
      if (typeof data === 'string') {
        socket.playerId = game.addPlayer(data);
        socket.emit("username", {
          id: socket.playerId,
          username: data
        })
        io.emit("updateGame", getGameState());
      } else {
        if (typeof data === 'object') {
          if (game.players.hasOwnProperty(data.id)) {
            socket.playerId = data.id;
            socket.emit('username', {
              id: data.id,
              username: game.players[data.id].username
            });
            io.emit('updateGame', getGameState()); // broadcast to everyone
          } else {
            socket.emit('username', false);
          }
        }
      }
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }

    // YOUR CODE HERE
  });

  socket.on('start', function () {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', `You are not a player of the game!`);
    }

    try {
      game.startGame();
      io.emit("start");
      io.emit("updateGame", getGameState());
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
    // YOUR CODE HERE
  });

  socket.on('playCard', function () {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', `You are not a player of the game!`);
    }

    try {
      var tmpObj = game.playCard(socket.playerId);
      io.emit("playCard", tmpObj);
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function () {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (!socket.playerId) {
      socket.emit("errorMessage", "You are not a player of the game!");
    }
    try {
      var obj = game.slap(socket.playerId);
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
    if (obj.winning) {
      winner = game.players[socket.playerId].username;
    }
    if (obj.message === 'got the pile!') {
      io.emit('clearDeck');
    } else {
      if (game.players[socket.playerId].pile.length === 0) {
        var counter = 0;
        var index = 0;
        for (var i in game.players) {
          if (game.players[i].pile.length > 0) {
            counter++;
            index = i;
          }
        }
        if (counter < 2) {
          winner = game.players[i].username;
          game.isStarted = false;
        } else {
          game.nextPlayer();
        }
      }
    }
    socket.broadcast.emit('updateGame', getGameState());
    socket.emit('message', obj.message);
    socket.broadcast.emit('message', game.players[socket.playerId].username + obj.message);

  });

});

var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('Express started. Listening on %s', port);
});
