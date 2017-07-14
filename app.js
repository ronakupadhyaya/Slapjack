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
  for(var player in game.players) {
    for(var key in game.players){
      if(game.players[key].pile.length===52){
        winner = game.players[key].name;
        game.isStarted = false;
      }
    }

    numCards[player] = game.players[player].pile.length;
    players = players + game.players[player].username + ',';
  }
  if(game.isStarted) {
    var playerid = game.playerOrder[0];
    currentPlayerUsername = game.players[playerid].username;
  } else {
    currentPlayerUsername = 'Game has not started yet';
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
    try{
      var newplayer = game.addPlayer(data);
    }
    catch(err){
      socket.emit('errorMessage',err.message)
    }
    socket.playerId = newplayer;
    socket.playerName = data;
    socket.emit('username',{
      username: data,
      id: socket.playerId
    });
    io.emit('updateGame',getGameState());
    // YOUR CODE HERE
  });

  socket.on('start', function() {
    if(!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    }
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      game.playerOrder = [];
      game.players = {};
      return;
    }

    try {
      game.startGame();
    }
    catch(err){
      socket.emit('errorMessage', err.message)
    }
    io.emit('start');

    io.emit('updateGame', getGameState());

  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      game.playerOrder = [];
      game.players = {};
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId) {
      socket.emit('errorMessage', 'You are not a player of the game!');
    }
    try {
      var playcard = game.playCard(socket.playerId);
    } catch(err) {
      socket.emit('errorMessage', err.message);
    }

    io.emit('playCard', playcard);

    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      game.playerOrder = [];
      game.players = {};
      return;
    }
    if (!socket.playerId){
      socket.emit('errorMessage', 'You are not a player of the game!');
      return;
    }
    try {
      var obj=game.slap(socket.playerId)
      console.log(obj)
    }
    catch(err) {
      socket.emit('errorMessage',err.message);
    }
    if(obj.winning){
      winner=socket.playerName;
    }else if(obj.message === 'got the pile!'){
      io.emit('clearDeck')
      io.emit('updateGame', getGameState())
    }else {
      var check = 0;
      var winner2='';
      for(var key in game.players){
        if(game.players[key].pile.length!==0){
          winner2 = game.players[key].name;
          check++;
        }
      }
      if(check>1){
        game.nextPlayer();
        io.emit('updateGame', getGameState());
        socket.emit('message','You lost 3 cards');
        socket.broadcast.emit('message',socket.playerName+' lost 3 cards!')
      }else{
        game.isStarted = false;
        winner = winner2;
        io.emit('updateGame', getGameState());
        socket.emit('message','You lost 3 cards');
        socket.broadcast.emit('message',socket.playerName+' lost 3 cards!')
      }
      }
    })
})

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
