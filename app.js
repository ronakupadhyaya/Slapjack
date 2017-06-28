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
  var numCards = {};
  var players = ""
  _.forEach(game.players, (player) => {
    numCards[player.id] = player.pile.length;
    players += player.username + ' '
  })

  players.replace(' ', ', ');

  if (!game.isStarted) {
    currentPlayerUsername = "Game has not started yet";
  }

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
    try {
      if (typeof data === 'string') {
        var id = game.addPlayer(data);
        socket.playerId = id;
        socket.emit('username', {id: id, username: data});
        io.emit('updateGame', getGameState());
      } else {
        if (game.players[data.id] === undefined) {
          socket.emit('username', false);
        } else {
          socket.playerId = data.id;
          socket.emit('username', {
            id: data.id,
            username: game.players[data.id].username
          });
          io.emit('updateGame', getGameState());
        }
      }
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;

    }
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', 'You are not a player of the game!');
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
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    }
    try {
      var card = game.playCard(socket.playerId);
      io.emit('playCard', card);
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
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    }
    try {
      var message = game.slap(socket.playerId);
      if (message.winning) {
        winner = game.players[playerId].username;
      } else if (message.message === 'got the pile!'){
        io.emit('clearDeck');
      } else if (game.players[playerId].pile.length === 0) {
        var counter = 0;
        var usern = "";
        _.forEach(game.players, (player) => {
          if (player.pile.length !== 0) {
            id = player.username;
            counter++;
          }
        })
        if (counter == 1) {
          winner = usern;
        } else {
          game.nextPlayer();
        }
      }
      io.emit('updateGame', getGameState());
      socket.emit('message', 'You lost 3 cards!');
      socket.broadcast.emit('message', game.players[playerId].username + ' lost 3 cards');
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
