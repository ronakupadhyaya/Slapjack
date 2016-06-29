"use strict";

var path = require('path');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var pug = require('pug');
var exphbs  = require('express-handlebars');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// ------------------------------------\\
// Switching out hbs for jade/pug      \\
// ------------------------------------\\
app.engine('hbs', exphbs({
  extname: 'hbs',
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');

// ------------------------------------\\
// pug app engine                      \\
// ------------------------------------\\
// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'views'));

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
  
  
  socket.emit('username', false);
  
  // Try to add a player to the game. 
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {
    try {
      var id = game.addPlayer(data)
    } catch (e) {
      socket.emit('username', false)
      return
    }
    socket.playerId = id
    socket.emit('username',id)
  });


  // Start the game & broadcast to entire socket 
  socket.on('start', function() {
    try {
      game.startGame()
    } catch (e) {
      socket.emit('Cannot start game yet, not enough players!')
      return
    }
    socket.broadcast.emit('start', 'game started')
    socket.emit('start', 'game started')
  });
  
  
  // call game.playCard, emit the result the broadcast it 
  socket.on('playCard', function() {
    console.log('card play attempted')
    try {
      game.playCard(socket.playerId)
    } catch(e) {
      socket.emit('message', 'Not your turn yet!')
      return
    }
    socket.emit('playCard', game.pile.slice(-1))
    socket.broadcast.emit('playCard', game.pile.slice(-1))
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly 
  socket.on('slap', function() {
    try {
      var result = game.slap(socket.playerId)
    } catch(e) {
      socket.emit('message',e)
      return
    }
    console.log(result)
    socket.emit('slap',result)
    if (result.winning) {
      socket.broadcast.emit('message',game.players[socket.playerId]+'just won the game!')  
    }
    else {
      socket.broadcast.emit('message',game.players[socket.playerId]+'just'+result.message)
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
