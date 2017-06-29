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
  var win;
  var playersInGame;
  // YOUR CODE HERE

  if(game.isStarted) {
    currentPlayerUsername = game.playerOrder[0].username;
  } else {
    currentPlayerUsername = "Game has not started yet";
  }

  // var newArr = [];
  // console.log(game.players);
  // for(var player in game.players){
  //   console.log(player);
  //   console.log(player.username, "testing");
  //   newArr.push(player.username);
  // }
  var playerArr = _.values(game.players);
  // console.log(playerArr);
  playerArr.join();
  var str = "";
  playerArr.forEach(function(player){
    str = str + player.username + ", ";
    numCards[player.id] = player.pile.length;
  })


  // playersInGame = newArr.join();
  // console.log(playersInGame);
  //
  // for(var playerId in game.players){
  //   numCards[playerId] = game.players[playerId].pile.length;
  //   if(game.isWinning(playerId)){
  //     win = game.players[playerId].username;
  //   }
  // }
  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: game.players[game.playerOrder[0]].username,
    playersInGame: str,
    cardsInDeck: game.pile.length,
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
    // YOUR CODE HERE
    try {
      var pid = game.addPlayer(data);
      socket.playerId = pid;
      socket.emit('username', {
        username: data, ///
        id: pid     //are these right?
      });
      io.emit('updateGame', getGameState());
    } catch(e){
      socket.emit('errorMessage', e.message);
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage', 'You are not a player of the game!')
    }
    try{
      game.startGame();
      io.emit('start');
      io.emit('updateGame', getGameState());
    } catch(e) {
      socket.emit('errorMessage', e.message);
    }


  });

  socket.on('playCard', function() {
    if(!socket.playerId){
      socket.emit('errorMessage', 'You are not a player of the game!')
    }

    try {
      var xyz = game.playCard(socket.playerId);
      io.emit('playCard', xyz);
    } catch(e) {
      socket.emit('errorMessage', e.message);
    }

    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE


    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if(!socket.playerId){
      socket.emit('errorMessage', 'You are not a player of the game!')
    }

    try{
      var obj = game.slap(socket.playerId);
      if(obj.winning){
        winner = game.players[playerId];
      }
      if(obj.message = "got the pile!"){
        io.emit('clearDeck');
      }
      if(game.players[playerId].pile.length === 0){
        if(game.playerOrder.length === 1){   //double check this logic
          game.isStarted = false;
          winner = game.players[playerId].username;
        } else {game.nextPlayer();
        }
      }
      io.emit('updateGame', getGameState());
      socket.broadcast.emit('message', + game.players[playerId].username + " lost 3 cards!");
      socket.emit('message', "You lost 3 cards!");
    } catch(e) {
      socket.emit('errorMessage', e.message);
    }

    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
