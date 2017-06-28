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
  var isStarted = game.isStarted
  var currentPlayerUsername;
  var players = "";
  var numCards = {};
  var cardsInDeck = game.pile.length
  var win;

  if (winner){
    win = winner;
  }
  var vals = _.values(game.players)
  var zeros = 0;
  vals.forEach(function(item){
    numCards[item.id] = item.pile.length
    if (vals[vals.length-1] === item){
      players = players + item.username
    }else{
      players = players + item.username +', '
    }
    if (game.playerOrder[0] === item.id){
      currentPlayerUsername = item.username;
    }
  })

  // YOUR CODE HERE

  // return an object with 6 different properties
  return {
    isStarted: isStarted,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: players,
    numCards: numCards,
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
    if (typeof data === 'string'){
      try{
        var playerId = game.addPlayer(data)
      }catch(e){
        socket.emit('errorMessage', e.message);
        return;
      }
      if (!socket.playerId){
        socket.playerId = playerId;
        localStorage.setItem("id", playerId);
        socket.emit('username',{ id:playerId, username:data } );
        io.emit('updateGame', getGameState())
      }
    }else if (typeof data === 'object'){
      if (game.players[data.id]){
        socket.playerId = data.id
        socket.emit('username', {id: data.id,username: game.players[data.id].username});
        io.emit('updateGame', getGameState()); // broadcast to everyone
      }else{
        socket.emit('username', false)
      }
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId){
      socket.emit('errorMessage', "You are not a player of this game!");
      return
    }
    try{
      game.startGame();
    }catch(e){
      socket.emit('errorMessage', e.message);
      return
    }
    io.emit('start');
    io.emit('updateGame',getGameState());
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId){
      socket.emit('errorMessage', "You are not a player of this game!");
      return
    }
    try{
      var play = game.playCard(socket.playerId);
    }catch(e){
      socket.emit('errorMessage', e.message);
      return;
    }
    io.emit('playCard', play);

    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (!socket.playerId){
      socket.emit('errorMessage', "You are not a player of this game!");
      return;
    }
    try{
      var play = game.slap(socket.playerId);
    }catch(e){
      socket.emit('errorMessage', e.message);
      return;
    }
    if (play.winning === true){
      winner = socket.playerId;
    }
    if (play.message === 'got the pile!'){
      io.emit('clearDeck')
    }else{
      if (game.players[socket.playerId].pile.length === 0){
        var vals = _.values(game.players)
        var zeros = 0;
        vals.forEach(function(item){
          if (item.pile.length === 0){
            zeros++
          }
        })
        if (zeros === vals.length){
          winner = socket.playerId;
          game.isStarted = false;
        }else{
          game.nextPlayer();
        }
      }
      io.emit('updateGame', getGameState());
      socket.emit('message', "You lost 3 cards");
      socket.broadcast.emit('message', socket.playerId + "lost 3 cards!");
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
