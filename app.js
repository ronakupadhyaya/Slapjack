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

app.engine('hbs', exphbs({
  extname: 'hbs',
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('combined'));

app.get('/', function(req, res) {
  res.render('index');
});

// Here is your new Game!
var Game = require('./game');
var game = new Game();

function getGameStatus(){
  var currentPlayerUsername = game.players[game.currentPlayer].username;
  var playersInGame = "";
  var numCards = {};
  for (var playerId in game.players){
    numCards[playerId] = game.players[playerId].pile.length;
    playersInGame += game.players[playerId].username + " ";
  }
  var cardsInDeck = game.pile.length
  
  return {
    currentPlayerUsername : currentPlayerUsername,
    playersInGame : playersInGame,
    numCards : numCards,
    cardsInDeck : cardsInDeck
  }
}

io.on('connection', function(socket){
  
  
  socket.emit('username', false);
  
  // Try to add a player to the game. 
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {
    try {
      var store = game.addPlayer(data)
    }
    catch (err){
    return socket.emit('username', false)
  }  console.log(store)
    socket.playerId = store;
    socket.emit('username', store);
    if (game.isStarted){
    socket.emit('updateGame', getGameStatus());
    socket.broadcast.emit('updateGame', getGameStatus());
    }

  });


  // Start the game & broadcast to entire socket 
  socket.on('start', function() {
    try {
      game.startGame()
    }
    catch (err) {
    return  socket.emit('message', "Cannot start game yet!")
    } 
    socket.emit('start');
    socket.broadcast.emit('start')
  });
  
  
  // call game.playCard, emit the result the broadcast it 
  socket.on('playCard', function() {
    console.log(game.currentPlayer, socket.playerId)
  try { 
    var card = game.playCard(socket.playerId)

  }
  catch (err) {
    console.log(err)
    return socket.emit('message', "Not your turn yet, Cowboy!")
  }
    socket.emit('playCard', card)
    socket.broadcast.emit('playCard', card) 
    socket.emit('updateGame', getGameStatus());
    socket.broadcast.emit('updateGame', getGameStatus());
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly 
  socket.on('slap', function() {
    try{
      var slap = game.slap(socket.playerId)
    }
    catch(err) {
      return socket.emit("message", "note: a failed slap does not throw an error!")
    }
    socket.emit("slap", slap)
    socket.broadcast.emit("message", game.players[socket.playerId].username + slap.message)
    socket.emit('updateGame', getGameStatus());
    socket.broadcast.emit('updateGame', getGameStatus());
  
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
