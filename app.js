"use strict";

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
  game.playerOrder.forEach(function(id) {
    numCards[id] = game.players[id].pile.length;
    if (game.players[id].pile.length !== 0) {
      players += game.players[id].username + ", ";
    }
  });
  if (!game.isStarted) {
    currentPlayerUsername = "Game has not started yet."
  } else {
    currentPlayerUsername = game.players[game.playerOrder[0]].username;
  }
  players = players.substring(0, players.length - 1);
  var winnerStatus;
  if (!winner) {
    winnerStatus = undefined;
  } else {
    winnerStatus = winner;
  }
  // return an object with 6 different properties
  game.persist();
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: players,
    cardsInDeck: game.pile.length,
    win: winnerStatus,
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
    game.persist();
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (typeof data === "string") {
      try {
        var playerId  = game.addPlayer(data);
      } catch (e) {
        socket.emit("errorMessage", e.message);
      }
      socket.playerId = playerId;
      var emitObj = {
        id: playerId,
        username: data
      };
      socket.emit("username", emitObj);
      io.emit("updateGame", getGameState());
    } else if (data){
      if (!game.players[data.id]) {
        socket.emit('username',false)
      } else{
        socket.playerId = playerId;
        socket.emit('username', {
          id: data.id,
          username: game.players[data.id].username
        });
      io.emit('updateGame', getGameState()); // broadcast to everyone
      }
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit("errorMessage", "You are not a player of the game.")
    } else {
      try {
        game.startGame();
      } catch (e) {
        socket.emit("errorMessage", e.message);
      }
      io.emit("start");
      io.emit("updateGame", getGameState());
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit("errorMessage", "You are not a player of the game.")
    } else {
      try {
        var obj = game.playCard(socket.playerId);
      } catch (e) {
        socket.emit("errorMessage", e.message);
      }
      io.emit("playCard", obj);
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
    if (!socket.playerId) {
      socket.emit("errorMessage", "You are not a player of the game.")
    } else {
      try {
        var obj = game.slap(socket.playerId);
      } catch (e) {
        socket.emit("errorMessage", e.message);
      }
      if (obj.winning === true) {
        winner = game.players[socket.playerId].username;
      }
      if (obj.message === "got the pile!") {
        io.emit("clearDeck");
      }
      if (game.players[socket.playerId].pile.length === 0) {
        if (game.pile.length === 52) {
          winner = game.players[socket.playerId].username;
          game.isStarted = false;
        } else {
          game.nextPlayer();
        }
      }
      io.emit("updateGame", getGameState());
      socket.emit("message", obj.message);
      socket.broadcast.emit("message", game.players[socket.playerId].username + " " + obj.message);
    }
  });

  socket.on('restart',function() {
    game = new Game();
    io.emit('updateGame',getGameState());
  })
});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
