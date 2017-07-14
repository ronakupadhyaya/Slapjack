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

  // return an object with 6 different properties
  return {

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

  socket.on('username', function(username) {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    try {
      socket.playerId = game.addPlayer(username);
      socket.emit("username", {id: socket.playerId, username: username})
      io.emit("updateGame", getGameState())
    } catch(err) {
      socket.emit('errorMessage', err.message)
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (! socket.playerId) {
      socket.emit('errorMessage', "You are not a player of the game!")
    }
    try {
      game.startGame()
      io.emit('start')
      io.emit('updateGame', getGameState())
    } catch(err) {
      socket.emit('errorMessage', err.message)
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (! socket.playerId) {
      socket.emit('errorMessage', "You are not a player of the game")
    }
    try {
      io.emit('playCard', game.playCard(socket.playerId))
    } catch (err) {
      socket.emit('errorMessage', err.message)
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
    if (! socket.playerId) {
      socket.emit('errorMessage', "You are not a player of the game")
    }
    try {
      var slapResponse = game.slap(socket.playerId);
      if (slapResponse.winning) {
        winner = game.players[game.playerOrder[socket.playerId]].username;
      }
      if (slapResponse.message === "got the pile!") {
        io.emit('clearDeck')
      }
      var oneLeft = false
      game.playerOrder.forEach(function(playerId) {
        if game.isWinning(playerId) {
          oneLeft = playerId
        }
      })
      if (oneLeft) {
        winner = game.players[game.playerOrder[oneLeft]].username;
      } else {
        game.nextPlayer()
      }
      io.emit('updateGame', getGameState())
      socket.emit('message', "You " + slapResponse.message);
      var username = game.players[game.playerOrder[socket.playerId]].username;
      socket.broadcast.emit('message', username + " " + slapResponse.message);

    } catch (err) {
      socket.emit('errorMessage', err.message)
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
