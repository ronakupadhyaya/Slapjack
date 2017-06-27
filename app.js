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
  var isStarted = game.isStarted;

  // YOUR CODE HERE
  var i = 0;
  for(var key in game.players){
    if(i!==0){
      players+=", "
    }
    numCards[key] = game.players[key].pile.length;
    players+= game.players[key].username;
  }

  // return an object with 6 different properties
  return {
    isStarted: isStarted,
    numCards: numCards,
    currentPlayerUsername: game.players[game.playerOrder[0]].username || 'Game has not started yet',
    playersInGame: players,
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
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(typeof data == "string"){
      try{
        var id = game.addPlayer(data);
        socket.playerId = id;
        socket.emit('username', {id: id, username: data})
        io.emit('updateGame', getGameState() )
      }
      catch(e){
        console.log("error in socket.on username");
        socket.emit('errorMessage', e.message)
      }

    }else{
      if(game.players.hasOwnProperty(data.id)){
        socket.playerId = data.id;
        socket.emit('username', {
            id: data.id,
            username: game.players[data.id].username
        });

        if(game.isStarted){

          socket.emit('start')
        }
        io.emit('updateGame', getGameState());
      }else{
        console.log("player id not a player id in game.players");
        socket.emit('username',false)
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
        socket.emit('errorMessage', 'Your are not a player of the game!')
    }else{
      try{
        console.log("about to calll startgame");
        game.startGame();
        console.log("start game completed about to emit start");
        io.emit('start');
        io.emit('updateGame', getGameState())
      } catch(e){
        console.log("error in socket.on start");
        socket.emit('errorMessage', e.message)
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
        socket.emit('errorMessage', 'Your are not a player of the game!')
    }else{
      try{
        var currentplayer = game.playCard(socket.playerId);
        io.emit('playCard', currentplayer)
        // io.emit('start');
        // io.emit('updateGame', game.getGameState())
      }catch(e){
        console.log("error in socket.on playcard");
        socket.emit('errorMessage', e.message)
      }
    }
    io.emit('updateGame', getGameState());
  });


  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if(!socket.playerId){
        socket.emit('errorMessage', 'Your are not a player of the game!')
    }else{
      try{
        var result = game.slap(socket.playerId);
        if(result.winning){
          winner = game.players[socket.playerId].username;
        }
        if(result.message == 'got the pile!'){
          io.emit('clearDeck');
        }

        if(game.players[socket.playerId].pile.length === 0){
          //CHECK IF THERE IS ONLY ONE PLAYER LEFT

          // game.nextPlayer();
          // var next = game.playerOrder[0];
          // game.nextPlayer();
          // var nextnext = game.playerOrder[0];
          var count = 0;
          var first;
          for(var key in game.players){
            if(game.players[key].pile.length > 0){
              first = game.players[key].username;
              count ++;
            }
          }
          if(count === 1){
            winner = first;
            game.isStarted = false;
          }

          // if(next == nextnext){
          //   winner = game.players[next].username;
          //   game.isStarted= false;
          // }
          else{
            // for(var i = 0; i<game.playerOrder.length -2; i++){
            //   game.nextPlayer();
            // }
            game.nextPlayer();
          }
        }

        io.emit('updateGame', getGameState());
        socket.emit('message','You '+ result.message);
        socket.broadcast.emit('message', game.players[socket.playerId].username+" "+result.message );
      }catch(e){
        console.log("error in socket.on slap");
        socket.emit('errorMessage', e.message)
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
