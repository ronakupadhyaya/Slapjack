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
  var playersInGame = "";
  var numCards = {};

  Object.keys(game.players).forEach((key) => {
    var player = game.players[key];
    playersInGame += (player.username + ' ');
    numCards[key] = player.pile.length;
  });
  console.log(numCards);

  if (game.isStarted) {
    var id = game.playerOrder[0];
    currentPlayerUsername = game.players[id].username;
  };

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: playersInGame,
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
    };
    try {
      if (typeof data === 'string') {
        var id = game.addPlayer(data);
        socket.playerId = id;
        socket.emit('username', {
          id: socket.playerId,
          username: data
        });

      } else if (typeof data === 'object') { //data is an object
        var matching = false;
        Object.keys(game.players).forEach((key) => {
          if (key === data.id) {
            matching = true;
          };
        });
        if (!matching) {
          socket.emit('username', false);
        } else {
          socket.playerId = data.id;
          socket.emit('username', {
            id: data.id,
            username: game.players[data.id].username
          });
        }
      } else if (data === false) {
        localStorage.setItem('id', ''); // reset the id in localStorage
        var username = prompt('Enter a username: ');
        socket.emit('username', username);
      }
      io.emit('updateGame', getGameState());
    } catch (e) {
      socket.emit('errorMessage', e.message);
    };


  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    } else {
      try {
        game.startGame();
        io.emit('start');
        io.emit('updateGame', getGameState());
      } catch (e) {
        socket.emit('errorMessage', e.message);
      }
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    } else {
      try {
        var cardInfo = game.playCard(socket.playerId);
        io.emit('playCard', cardInfo);
      } catch (e) {
        socket.emit('errorMessage', e.message);
      }
    };
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    } else {
      try {
        var afterSlap = game.slap(socket.playerId);
        if (afterSlap.winning) {
          winner = socket.username;
          game.isStarted = false;
        } else {
          game.nextPlayer();
        };
        io.emit('updateGame', getGameState());
        socket.broadcast.emit('message', socket.username + ' ' + afterSlap.message);
        socket.emit('message', 'You ' + afterSlap.message);
      } catch (e) {
        socket.emit('errorMessage', e.message);
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('Express started. Listening on %s', port);
});
