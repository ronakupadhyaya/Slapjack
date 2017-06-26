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
var count = 0;
var winner = null;

function getGameState() {
  var currentPlayerUsername;
  var players = "";
  var numCards = _.mapObject(game.players, function(player, playerId) {
    if (playerId == game.playerOrder[0]){
      currentPlayerUsername = player.username;
    }
    players += player.username + ", ";
    return player.pile.length;
  });

  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername || "Game has not started yet",
    playersInGame: players,
    cardsInDeck: game.pile.length,
    win: winner
  }
}

io.on('connection', function(socket) {

  if (game.isStarted) {
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
    console.log(game.players);
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (typeof data === 'string') {
      try {
        var id = game.addPlayer(data);
        console.log(game.players);
        socket.playerId = id;
        socket.emit('username', {
          id: id,
          username: data
        });
        io.emit('updateGame', getGameState()); // broadcast to everyone
      } catch (e) {
        socket.emit('errorMessage', e.message);
      }
    } else {
      if (!game.players.hasOwnProperty(data.id)) {
        socket.emit('username', false);
        return;
      }
      socket.playerId = data.id;

      socket.emit('username', {
        id: data.id,
        username: game.players[data.id].username
      });
      io.emit('updateGame', getGameState()); // broadcast to everyone
    }
  });

  // Start the game & broadcast to entire socket
  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }
    try {
      game.startGame();
      io.emit('start');
      io.emit('updateGame', getGameState()); // broadcast to everyone
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
  });

  // call game.playCard, emit the result the broadcast it
  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }

    try {
      var card = game.playCard(socket.playerId);
      io.emit('playCard', card);
      io.emit('updateGame', getGameState()); // broadcast to everyone
    } catch(e) {
      io.emit('updateGame', getGameState()); // broadcast to everyone
      socket.emit('errorMessage', e.message);
    }
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly
  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }

    try {
      var slap = game.slap(socket.playerId);
      if (slap.winning) {
        winner = game.players[socket.playerId].username;
      }
      if (slap.message === 'got the pile!') {
        io.emit('clearDeck');
      } else if (game.players[socket.playerId].pile.length === 0) { // has no more cards
        var count = 0; // how many players with 0 cards
        var win = "";
        for (let player of _.values(game.players)) {
          if (player.pile.length === 0) {
            count++;
          } else {
            win = player.username;
          }
        }
        if (count === game.playerOrder.length - 1) {
          winner = win;
          game.isStarted = false;
        } else {
          game.nextPlayer();
        }
      }
      io.emit('updateGame', getGameState()); // broadcast to everyone
      socket.emit('message', `You ${slap.message}`);
      socket.broadcast.emit('message', `${game.players[socket.playerId].username} ${slap.message}`);
    } catch(e) {
      console.log(e);
      socket.emit('errorMessage', e.message);
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
