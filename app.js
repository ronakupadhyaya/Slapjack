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
  var playersInGame = "";
  var numCards = {};
  var cardsInDeck;
  var win;

  // populate numCards
  numCards = _.mapObject(game.players, (playerObj) => (playerObj.pile.length));
  // for(var playerId in game.players){
  //   numCards[playerId] = game.players[playerId].pile.length;
  // }
  currentPlayerUsername = (game.isStarted) ? _.findWhere(game.players, {id: game.playerOrder[0]}).username : 'Game has not started yet';
  var playerArr = _.map(game.playerOrder, (playerId) => (_.findWhere(game.players, {id: playerId}).username));
  playersInGame = playerArr.join(' ');

  cardsInDeck = game.pile.length;

  win = (winner) ? winner : undefined;



  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: playersInGame,
    cardsInDeck: cardsInDeck,
    win: win
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
    if(typeof data === 'string'){
      try{
        socket.playerId = game.addPlayer(data);
        socket.emit('username', {id: socket.playerId, username: data});
        io.emit('updateGame', getGameState());
      }catch(e){
        socket.emit('errorMessage', e.message);
      }
    }else{
      // if id is not valid
      console.log('data id is', data.id, game.players);
      if(!game.players.hasOwnProperty(data.id)){
        socket.emit('username', false);
      }else{
        // rejoin
        socket.playerId = data.id;
        socket.emit('username', {
          id: data.id,
          username: game.players[data.id].username
        });
        io.emit('updateGame', getGameState());
      }
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if(!socket.playerId){
      socket.emit('errorMessage', 'You are not a player of the game.');
      return;
    }
    // start game
    try{
      game.startGame();
      io.emit('start');
      io.emit('updateGame', getGameState());
    }catch(e){
      socket.emit('errorMessage', e.message);
    }

  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }
    try{
      var cardObj = game.playCard(socket.playerId);
      io.emit('playCard', cardObj);
      // TODO: if player runs out of cards
    }catch(e){
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
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }
    try{
      var statusObj = game.slap(socket.playerId);
      var currPlayer = _.findWhere(game.players, {id: socket.playerId});
      if(statusObj.winning){
        winner = currPlayer.username;
      }
      if(statusObj.message === 'got the pile!'){
        io.emit('clearDeck');
      }
      if(currPlayer.pile.length === 0){
        var winningPlayers = _.filter(game.playerOrder, (playerId) => (_.findWhere(game.players, {id: playerId}).pile.length >= 0));
        if(winningPlayers.length === 1){
          winner = winningPlayers[0].username;
          game.isStarted = false;
        }else{
          game.nextPlayer();
        }
      }
      // broadcast game state
      io.emit('updateGame', getGameState());
      // for self
      socket.emit('message', 'You ' + statusObj.message);
      // for everyone else
      socket.broadcast.emit('message', currPlayer.username + ' ' + statusObj.message);


    }catch(e){
      socket.emit('errorMessage', e.message);
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
