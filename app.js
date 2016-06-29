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
var Game = require('./game');
var game = new Game();

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


io.on('connection', function(socket){
  socket.emit('username', false);
  socket.on('username', function(data) {
    try {
      var id = game.addPlayer(data);
      socket.playerId = id;
    } catch(e) {
      socket.emit('username', false);
      return console.error(e);
    }
    socket.emit('username', id);
  });

  socket.on('start', function() {
    try {
      game.startGame();
    } catch(e) {
      return console.error(e);
    }
    socket.broadcast.emit('start');
  });

  socket.on('playCard', function() {
    try {
      var card = game.playCard(socket.playerId);
    } catch(e) {
      socket.emit('oopsie', 'Not your turn!');
      return console.error(e);
    }
    socket.emit('playCard', card);
    socket.broadcast.emit('playCard', card);
  });

  socket.on('slap', function() {
    try {
      var slap = game.slap(socket.playerId);
    } catch(e) {
      socket.emit('oopsie', e);
      return console.error(e);
    }
    socket.emit('slap', slap);
    socket.broadcast.emit('message', game.players[socket.playerId].username 
      + ' ' + slap.message);
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
