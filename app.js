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

  // numCards is an object with the keys as playerIds and value as number of Cards
  _.forEach(game.players, function(player, key) {
    numCards[key] = player.pile.length;
  });

  // currentPlayerUsername is the current player
  if (game.isStarted) {
    currentPlayerUsername = game.players[game.playerOrder[0]].username;
  }
  else {
    currentPlayerUsername = "Game has not started yet";
  }
  // playersInGame is a string with the name of all players in the game
  _.forEach(game.players, function(player, key) {
    players += player.username + ", ";
  });
  var newPlayers = players.slice(0, players.length-2);

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: newPlayers,
    cardsInDeck: game.pile.length,
    win: winner || undefined
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
    if (typeof data === "string") {
      if (winner) {
        socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
        return;
      }
      try {
        var playerId = game.addPlayer(data);
        socket.playerId = playerId;
        socket.emit('username', {
          id: playerId,
          username: data
        });
        io.emit('updateGame', getGameState());
      }
      catch(err) {
        console.log(err);
        socket.emit('errorMessage', err.message);
      }
    }
    else {
      if (!game.players[data.id]) {
        socket.emit('username', false);
      }
      else {
        socket.playerId = data.id;
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
      socket.emit('errorMessage', "You are not a player of the game!");
    }
    else {
      try {
        game.startGame();
        io.emit('start');
        io.emit('updateGame', getGameState());
      }
      catch(err) {
        socket.emit('errorMessage', err.message);
      }
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', "You are not a player of the game!");
    }
    else {
      try{
        var currPlayed = game.playCard(socket.playerId);
        io.emit('playCard', currPlayed);
      }
      catch (err) {
        socket.emit('errorMessage', err.message);
      }
    }
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', "You are not a player of the game!");
    }
    else {
      try{
        // get current player to slap pile, returns object
        var slap = game.slap(socket.playerId);
        // if it was a winning slap
        if (slap.winning) {
          // the winner gets the pile, clear the game pile
          winner = socket.playerId;
          if (slap.message = "got the pile!") {
            io.emit('clearDeck');
          }
          if (game.players[socket.playerId].pile.length === 0) {
            // count the number of players still playing
            var count = game.players.length;
            _.forEach(game.players,function(player, key) {
              if (player.pile.length === 0) {
                count--;
              }
            });
            // if there is only one player left, set winner
            if (count === 1) {
              winner = game.players[socket.playerId].username;
            }
            else {
              game.nextPlayer();
            }
          }
        }
        io.emit('updateGame', getGameState());
        socket.emit('message', "You lost 3 cards!");
        socket.broadcast.emit('message', game.players[socket.playerId].username + "lost 3 cards!");
      }
      catch(err) {
        socket.emit('errorMessage', err.message);
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
