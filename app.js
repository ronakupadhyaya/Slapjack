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
app.use(bodyParser.urlencoded({ extended: true }));
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
  var numCards = {};
  var playersInGame = "";

  // YOUR CODE HERE
  for (var id in game.players) {
    numCards[id] = game.players[id].pile.length
  }

  if (!game.isStarted) {
    currentPlayerUsername = 'Game has not started yet'
  } else {
    for (var id in game.players) {
      if (game.players.id === game.playerOrder[0].id)
        currentPlayerUsername = game.players[id].username
    }
  }

  playersInGame = game.numActivePlayers().join(', ')

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: playersInGame,
    cardsInDeck: game.pile.length,
    win: winner || undefined
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
    // YOUR CODE HERE
    try {
      socket.playerId = game.addPlayer(data)
      socket.emit('username', {
        id: socket.playerId,
        username: data
      });
      io.emit('updateGame', getGameState())
    }
    catch (e) {
      socket.emit('errorMessage', e.message)
    }
  });

  socket.on('start', function () {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game')
    } else {
      try {
        game.startGame()
        io.emit('start')
        io.emit('updateGame', getGameState())
      }
      catch (e) {
        socket.emit('errorMessage', e)
      }
    }
  });

  socket.on('playCard', function () {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game')
    } else {
      try {
        var playedCard = game.playCard(socket.playerId)
        io.emit('playCard', playedCard)
      }
      catch (e) {
        socket.emit('errorMessage', e)
      }
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
      socket.emit('errorMessage', 'You are not a player of the game')
    } else {
      try {
        var slapject = game.slap(socket.playerId);
        if (slapject.winning) { //Check if the slapper got the 52 cards and won
          winner = socket.username
          //game.isStarted = false
          // why not that? because we already set it in the slap function
        }
        if (slapject.message === 'got the pile!') //Check if the slapper was right
          io.emit('clearDeck')
        if (!game.players[socket.playerId].pile.length) { //Check if slapper has no cards anymore
          var active = game.numActivePlayers()
          if (active.length === 1) {  //If there is only one active player
            winner = active[0];  //Then he won
            game.isStarted = false; //Game is over
          } else {
            game.nextPlayer()
          }
        }
        io.emit('updateGame', getGameState())
        socket.emit('message', 'You ' + slapject.message)
        socket.broadcast.emit('message', game.players[socket.playerId].username + ' ' + slapject.message)
      }
      catch (e) {
        socket.emit('errorMessage', e.message)
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('Express started. Listening on %s', port);
});
