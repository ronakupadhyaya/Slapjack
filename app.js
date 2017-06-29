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

  socket.on('username', function(data) {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    try {
      //playerId is randomly generated return
      var playerId = game.addPlayer(data);
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
    socket.playerId = playerId;
    socket.emit('username', {id: playerId, username: data});
    var gameState = getGameState();
    io.emit('updateGame', gameState);
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if(!socket.playerId) {
      socket.emit('errorMessage', `You are not the player of the game!`)
    }
    try {
      game.startGame();
    } catch (e) {
      socket.emit('errorMessage', e.message)
    }
    io.emit('start')
    var gameState = getGameState()
    io.emit('updateGame', gameState)

  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if(!socket.playerId) {
      socket.emit('errorMessage', `You are not the player of the game!`);
      return
    }
    try {
      var playCard = game.playCard(socket.playerId);
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
    // broadcast to everyone the game state
    io.emit('playCard', playCard)
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if(!socket.playerId) {
      socket.emit('errorMessage', `You are not the player of the game!`);
      return
    }
    try {
      var slapObj = game.slap(socket.playerId);
    } catch (e) {
      socket.emit('errorMessage', e.message);
    }
    if(slapObj.winner) {
      winner = socket.playerId
    }

    if(slapObj.message === 'lost 3 cards!') {
      io.emit('clearDeck');
    }
    console.log('i literally fucking stop here');
    var activePlayers = [];
    if(game.players[socket.playerId].pile.length === 0) {
      console.log('or fucking right hers');
      console.log(game.playerOrder);
      // game.playerOrder.forEach(function(player) {
      //   console.log('bruh');
      //   if(game.players[player].pile.length > 0) {
      //     activePlayers.push(player)
      //   }
      // })

      console.log('im here boy');

      if(activePlayers.length === 1) {
        winner = this.players[activePlayers[0]].pile;
        game.isStarted = false;
      } else {
        game.nextPlayer();
      }
      console.log('im here');
      io.emit('updateGame');
      socket.broadcast.emit('message', `User lost three cards`);
      socket.emit('message', 'You just lost three cards')
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
