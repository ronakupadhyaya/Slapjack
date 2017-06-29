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
var winner = null; // status of winner

function getGameState() {
  var isStarted = game.isStarted;
  var numCards = {};
  var playersInGame = "";
  game.playerOrder.forEach(function(pId) {
    var currPlayer = game.players[pId]
    numCards[pId] = currPlayer.pile.length;
    playersInGame += currPlayer.username + ", ";
  });
  playersInGame = playersInGame.substring(0, playersInGame.length-1);
  var defaultUser = "game has not started yet";
  var currentPlayerUsername = (!game.isStarted) ? defaultUser : game.players[game.playerOrder[0]].username;
  var cardsInDeck = game.pile.length;
  var win = winner || undefined;

  // return an object with 6 different properties
  return {isStarted, numCards, currentPlayerUsername, playersInGame, cardsInDeck, win};
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
  //receive status event: take status and add player; send back status event
  socket.on('status', function(data) {
    var status = data;
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    //try add player, catch error if exists
    try {
      var pId = game.addPlayer(status);
    } catch(err) {
      socket.emit('errorMessage', err.message);
    }
    //change socket and emit to browser status event
    socket.playerId = pId;
    var sendData = {id: pId, status: status};
    socket.emit('status', sendData);
    var status = getGameState();
    io.emit('updateGame', status);
  });
  //check win, check err, otehrwise start game
  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (! socket.playerId) {
      socket.emit('errorMessage', "YOU are NOT a player of the game!");
    }
    try {
      game.startGame();
    } catch(err) {
      socket.emit('errorMessage', err.message);
    }
    io.emit('start');
    var status = getGameState();
    io.emit('updateGame', status);
  });
  //receive username: check if string (new username), or object (existing user id)
  socket.on('username', function(data) {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    var username = null;
    var id = null;
    if (typeof data === "string") {
      username = data;
      //try add player, catch error if exists
      try {
        var pId = game.addPlayer(username);
      } catch(err) {
        socket.emit('errorMessage', err.message);
      }
      //change socket and emit to browser username event
      socket.playerId = pId;
      var sendData = {id: pId, username: username};
      socket.emit('username', sendData);
      var status = getGameState();
      io.emit('updateGame', status);

    } else {
      id = data.id;
      //check if legit id, initialize if so
      if (game.playerOrder.indexOf(id) < 0) {
        socket.emit('username', false);
      } else {
        socket.playerId = id;
        socket.emit('username', {
         id: data.id,
         username: game.players[data.id].username
        });
        io.emit('updateGame', getGameState());
      }
    }
  });
  //play card
  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (! socket.playerId) {
      socket.emit('errorMessage', 'YOU are NOT a player of the game');
    }

    try {
      var card = game.playCard(socket.playerId);
    } catch (err) {
      if (err.message.indexOf('tie') > 0) {
        io.emit('errorMessage', err.message);
        return;
      }
      socket.emit('errorMessage', err.message);
    }

    io.emit('playCard', card);

    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (! socket.playerId) {
      socket.emit('errorMessage', "YOU are NOT a player of this game!");
    }
    var result = null;
    try {
      result = game.slap(socket.playerId);
    } catch(err) {
      socket.emit('errorMessage', err.message);
    }

    //set winner if won
    var username = game.players[socket.playerId].username;
    if (game.isWinning(socket.playerId)) {
      console.log('changes winner');
      winner = username;
    }
    //clear deck if obtained
    if (result.message === "got the pile!") {
      io.emit('clearDeck');
    }
    //game over if player has no more cards and only one other player:
    if (game.players[socket.playerId].pile.length === 0 && game.playerOrder.length === 2) {
      //find other player:
      if (game.playerOrder[0] === socket.playerId) {
        console.log('reaches win among 2 ppl: 1');
        winner = game.players[game.playerOrder[1]];
      } else {
        console.log('reaches win among 2 ppl: 2');
        winner = game.players[game.playerOrder[0]];
      }
      game.isStarted = false;
    } else {
      game.nextPlayer();
    }
    var status = getGameState();
    io.emit('updateGame', status);
    var myMessage = "you " + result.message;
    var theirMessage = username +" "+ result.message;
    socket.emit('message', myMessage);
    socket.broadcast.emit('message', theirMessage);
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
