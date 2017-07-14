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
  var numbCards = {}
  var currentUser = game.players[game.playerOrder[0]].username;
  var currentPlayers = []
  game.playerOrder.forEach(function(item) {
    numbCards[item] = game.players[item].pile.length
    currentPlayers.push(game.players[item].username)
  })
  if (!game.isStarted) {
    currentUser = 'Game has not started yet'
  }
  currentPlayers = currentPlayers.join(', ')
  // var obj = {hi: "johnathan"}
  // console.log(obj)
  // return obj;
  return {
    isStarted: game.isStarted,
    numCards: numbCards,
    currentPlayerUsername: currentUser,
    playersInGame: currentPlayers,
    cardsInDeck: game.pile.length,
    win: winner
  }
  // return an object with 6 different properties
  // return {
  //
  // }
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
    var playerId;
    try {
      playerId = game.addPlayer(username)
    //  console.log(playerId + ' ' + JSON.stringify(game.players))
      socket.playerId = playerId;
      socket.emit('username', {
        id: playerId,
        username: username
      })
    //  console.log("gettting game state: ", getGameState())
      io.emit('updateGame', getGameState())
    }
    catch(error) {
      socket.emit('errorMessage', error.message)
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    console.log('game started');
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game')
    }
    else {
      try {
        game.startGame()
        io.emit('start')
        io.emit('updateGame', getGameState())
      }
      catch(error) {
        socket.emit('errorMessage', error.message)
      }
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    console.log('card played');
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game');
    }
    else {
      var playedCard;
      try {
        playedCard = game.playCard(socket.playerId);
        io.emit('playCard', playedCard);
      }
      catch(error) {
        socket.emit('errorMessage', 'It is not your turn yet!');
      }
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
    if (!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game')
    }
    else {
      var result;
      try {
        result = game.slap(socket.playerId)
        if (result.winning) {
          winner = game.players[socket.playerId].username
        }
        if (result.message === 'got the pile!') {
          io.emit('clearDeck')
        }
        var lostPlayers = 0;
        var winningPlayer;
        if (game.players[socket.playerId].pile.length === 0) {
          for (var i = 0; i < game.playerOrder.length; i++) {
            if (game.players[game.playerOrder[i]].pile.length === 0) {
              lostPlayers ++
            }
            else {
              winningPlayer = game.players[game.playerOrder[i]].username
            }
          }
        }
        if (lostPlayers === Object.keys(game.players).length - 1) {
          winner = winningPlayer
          game.isStarted = false;
        }
        else {
          game.nextPlayer()
          io.emit('updateGame', getGameState())
          socket.emit('message', 'You lost 3 cards!')
          socket.broadcast.emit('message', game.players[socket.playerId].username + ' lost 3 cards!')
        }
      }
      catch(error) {
        socket.emit('errorMessage', error.message)
      }
    }
  })
  });



var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
