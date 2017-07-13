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
  var currentPlayerUsername = game.players[game.playerOrder[0]].username;
  var players = "";
  var temp = [];
  var numCards = {};

  _.mapObject(game.players, function(val, key) {
    temp.push(val.username);
    numCards[key] = val.pile.length;
  })

  players = temp.join(', ');

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
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
    var id;
    try {
      id = game.addPlayer(data);
    } catch (err) {
      socket.emit('errorMessage', err.message);
    }

    socket.playerId = id;

    socket.emit('username', {
      id: id,
      username: data
    });

    io.emit('updateGame', getGameState())
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }

    if (socket.playerId === undefined)
      socket.emit('errorMessage', 'You are not a player of the game');
    else {
      try {
        game.startGame()
      } catch (err) {
        socket.emit('errorMessage', err.message);
      }

      io.emit('start');

      io.emit('updateGame', getGameState());
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }

    var card;

    if (socket.playerId === undefined)
      socket.emit('errorMessage', 'You are not a player of the game');
    else {
      try {
        card = game.playCard(socket.playerId);
      } catch (err) {
        socket.emit('errorMessage', err.message);
      }

      io.emit('playCard', card)
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

    var obj;
    var username = game.players[socket.playerId].username

    if (socket.playerId === undefined)
      socket.emit('errorMessage', 'You are not a player of the game');
    else {
      try {
        obj = game.slap(socket.playerId);
      } catch (err) {
        socket.emit('errorMessage', err.message);
      }

      if (obj.winning) {
        winner = username;
      }

      if (obj.message === 'got the pile!') {
        io.emit('clearDeck');
      }
      if (game.players[socket.playerId].pile.length === 0) {
        _.mapObject(game.players, function(val, key) {
          if (val.pile.length === 52) {
            winner = val.username;
            game.isStarted = false;
          }
        })
      } else {
        try {
          game.nextPlayer();
        } catch (err) {
          socket.emit('errorMessage', err.message);
        }

        io.emit('updateGame', getGameState());

        socket.broadcast.emit('message', username + ' ' + obj.message);
        socket.emit('message', 'You ' + obj.message);
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('Express started. Listening on %s', port);
});