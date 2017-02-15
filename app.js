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

  socket.emit('username', false);

  // Try to add a player to the game.
  // If you can't, emit('username', false), return out of callback
  // If you successfully add the player, emit ('username', id)
  socket.on('username', function(data) {
    var newPlayer;
    try {
      newPlayer = game.addPlayer(data);
      socket.playerId = newPlayer;
      socket.emit('username', newPlayer)
    } catch (e) {
      socket.emit('username', false);
    }
      socket.emit('username', newPlayer);
  });


  // Start the game & broadcast to entire socket
  socket.on('start', function(data) {
    // io.emit('start', data); // vs socket.broadcast; io includes sender

    try {
      game.startGame();
    } catch (e) {
      console.log(e);
      socket.emit('message', 'Cannot start game yet');
    }
    socket.emit('start')
    socket.broadcast.emit('start');
  });


  // call game.playCard, emit the result then broadcast it
  socket.on('playCard', function(data) {
    var myCard;
    try {
      myCard = game.playCard(socket.playerId);
    } catch (e) {
      socket.emit('message', 'Not your turn yet!');
    }
    socket.emit('playCard', myCard)
    socket.broadcast.emit('playCard', myCard)
  });

  // Try to slap! Emit, broadcast, and handle errors accordingly
  socket.on('slap', function() {
    var myResult = {};
    var myId = socket.playerId;
    try {
      // console.log('inside', game.slap(socket.playerId));
      myResult = game.slap(socket.playerId);
    } catch (e) {
      socket.emit('message', e);
    } finally {
      var username = game.players[myId].username;
      console.log('my result', myResult)
      if(myResult.result) {
        socket.emit('slap', 'You just won the game!')
        socket.broadcast.emit('slap', username + ' just won the game!')
      } else {
        socket.emit('slap', "You just " + myResult.message);
        socket.broadcast.emit('slap', username + 'just ' + myResult.message);
      }
    }
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
