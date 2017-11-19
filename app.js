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
  var players = game.players;
  var playerOrder = game.playerOrder;
  var currentPlayerId = playerOrder[0];
  var currentPlayerUsername = game.isStarted ? players[currentPlayerId].username : 'Game has not started yet';
  var numCards = {};
  playerOrder.forEach(function(playerId){
    numCards[playerId] = players[playerId].pile.length;
  })
  var playersInGame = _.map(playerOrder, function(playerId){
    return players[playerId].username;
  });
  playersInGame = playersInGame.join(', ');
  // YOUR CODE HERE
  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: playersInGame,
    cardsInDeck: game.pile.length,
    win: winner || undefined
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
    //console.log("Data:",data);
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(typeof data === "string"){
      try{
        var playerId = game.addPlayer(data);
        //console.log("Players:",game.players);
        socket.playerId = playerId;
        socket.emit('username',{
          id: playerId,
          username: data
        });
        io.emit('updateGame',getGameState());
      }catch(error){
        socket.emit('errorMessage',error.message);
      }
    }
    else{
      console.log("Players:",game.players);
      if(!game.players[data.id]){
        socket.emit('username',false);
      }
      else{
        socket.playerId = data.id;
        socket.emit('username',{
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
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage','You are not a player of the game!');
    }
    else{
      try{
        game.startGame();
        io.emit('start');
        io.emit('updateGame',getGameState());
      }catch(error){
        socket.emit('errorMessage',error.message);
      }
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage','You are not a player of the game!');
    }
    else{
      try{
        var card = game.playCard(socket.playerId);
        io.emit('playCard',card);
      }catch(error){
        socket.emit('errorMessage',error.message);
      }
    }
    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());////////////////////////////
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage','You are not a player of the game!');
    }
    else{
      try{
        var slapResult = game.slap(socket.playerId);
        if(slapResult.winning){
          winner = game.players[socket.playerId].username;
        }
        if(slapResult.message==="got the pile!"){
          io.emit('clearDeck');
        }
        else if(game.players[socket.playerId].pile.length === 0){
          game.playerOrder.forEach(function(id){
            if(game.isWinning(id)){
              winner = game.players[id].username;
              game.isStarted=false;
            }
          });
          if(!winner){
            game.nextPlayer();
          }
        }
        io.emit('updateGame', getGameState());////////////////////////////
        socket.emit('message',`You ${slapResult.message}`);
        socket.broadcast.emit('message',`${game.players[socket.playerId].username} ${slapResult.message}`);
      }catch(error){
        socket.emit('errorMessage',error.message);
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
