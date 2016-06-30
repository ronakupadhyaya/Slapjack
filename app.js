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

io.on('connection', function(socket){
  console.log('connected');
  
  
  socket.emit('username', false);
  
  // Try to add a player to the game. 
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {
    try{game.addPlayer(data);}
      catch(e){
        if(e){
          socket.emit('username',false);
        
      }else{
        // console.log("socket.playerId", socket.playerId)
        // console.log("game.addPlayer", game.addPlayer(data))
        socket.playerId = game.addPlayer(data);
        socket.emit('username', socket.playerId);
      }
    }
  });


  // Start the game & broadcast to entire socket 
  socket.on('start', function() {
   try{game.startGame();}
    catch(e){
      if(e){
        socket.emit('message','cannot start game, get fucked and stay fucked')
      } else{
        socket.broadcast.emit('start');
      }
    } 
  });
  
  
  // call game.playCard, emit the result the broadcast it 
  socket.on('playCard', function() {
    try{game.playCard(socket.playerId);}
      catch(e){
        if(e){
          socket.emit('message','Not your turn yet!')
        } else{
          socket.emit('playCard');
          socket.broadcast.emit('playCard');
        }
      }
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly 
  socket.on('slap', function() {
   try {
      var slap = game.slap(socket.playerId);
    } catch(e) {
      socket.emit('oopsie', e);
      return console.error(e);
    }

    socket.emit('slap', { slap: slap, gameState: getGameState()});
    socket.broadcast.emit('slap', { slap: slap, gameState: getGameState()});
    
    socket.broadcast.emit('message', game.players[socket.playerId].username 
      + ' ' + slap.message);

    socket.emit('clearDeck');
    socket.broadcast.emit('clearDeck');
  });
});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
