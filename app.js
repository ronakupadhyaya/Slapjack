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
  currentPlayerUsername = game.isStarted ? game.players[game.playerOrder[0]].username : "Game has not started yet"
  _.forEach(game.players, function(player, key, list){
    numCards[key] = player.pile.length;
  });

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    cardsInDeck: game.pile.length,
    winner: winner
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
    // YOUR CODE HERE
    try{
      if(typeof data === 'string'){
        socket.playerId = game.addPlayer(data);
        localStorage.setItem(playerId, socket.playerId);
        socket.emit('username', {
          id: socket.playerId,
          username: data
        });

      } else{
        if(game.players[data.id]){
          socket.playerId = data.id;
          socket.emit('username', {
            id: data.id,
            username: game.players[data.id].username
          })
        }
        else{
          socket.emit('username', false);
        }

      }
      io.emit('updateGame', getGameState())

    }
    catch(err){
      socket.emit("errorMessage", err.message);
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage', ' You are not a player of the game!');
      return;
    }
    try{
      game.startGame();
      io.emit('start', "Everything is good");
      io.emit('updateGame', getGameState());
    }
    catch(err){
      console.log("err", err);
      socket.emit("errorMessage", err.message);
    }
  });

  socket.on('playCard', function() {
    console.log("anything");
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if(!socket.playerId){
      console.log("in here?");
      socket.emit('errorMessage', ' You are not a player of the game!');
      return;
    };
    try{
      console.log("here?");
      io.emit('playCard', game.playCard(socket.playerId));
    }
    catch(err){
      console.log("err", err);
      socket.emit("errorMessage", err.message);
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

    if(!socket.playerId){
      socket.emit('errorMessage', ' You are not a player of the game!');
      return;
    }

    try{
      var slapObj = game.slap(socket.playerId);
      if(slapObj.winning){
        winner = game.players[socket.playerId].username;
        io.emit('message', winner + ' has won! The rest of you suck.')
      }
      if(slapObj.message ==='got the pile!'){
        io.emit('clearDeck');
      }
      if(game.players[socket.playerId].pile.length === 0){
        var playerArr =[];
        _.forEach(game.players, function(player){
          if(player.pile.length > 0){
            playerArr.push(player);
          }
        });

        if(playerArr.length === 1){
          winner = playerArr[0].username;
          socket.broadcast.emit('message', 'You won! Congratulations :)');
          game.isStarted = false;
        } else{
          game.nextPlayer();
        }
      }
      io.emit('updateGame', getGameState());
      socket.emit('message', 'You ' + slapObj.message);
      socket.broadcast.emit('message', game.players[socket.playerId].username + slapObj.message)

    }
    catch(err){
      console.log("err", err);
      socket.emit("errorMessage", err.message);
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
