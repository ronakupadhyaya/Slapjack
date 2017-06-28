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
    if(typeof data === 'string'){
      try{
        socket.playerId = game.addPlayer(data);
        socket.emit('username',{
          id: socket.playerId,
          username: data
        })
      } catch(err){
        socket.emit('errorMessage', 'this went wrong: '+err);
        return;
      }
    }
    io.emit('updateGame', getGameState());
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage',"You're not a player");
      return;
    } else {
      try{
        game.startGame();
      } catch(err) {
        socket.emit('errorMessage', 'this went wrong: '+err);
        return;
      }
      io.emit('start');
      io.emit('updateGame',getGameState())
    }
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
      socket.emit('errorMessage',"You're not a player");
      return;
    } else {
      var returned;
      try{
        returned = game.playCard(socket.playerId)
      } catch (err) {
        socket.emit('errorMessage', 'this went wrong: '+err);
        return;
      }
      io.emit('playCard',returned)
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
      socket.emit('errorMessage',"You're not a player");
      return;
    } else {
      var msg;
      try {
        msg=game.slap(socket.playerId);
      } catch (err) {
        socket.emit('errorMessage', 'this went wrong: '+err);
        return;
      }
      if(msg.winning){
        winner= game.players[playerId];
        if(msg.message==='got the pile!'){
          io.emit('clearDeck')
        }
      } else {
        game.nextPlayer();
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
