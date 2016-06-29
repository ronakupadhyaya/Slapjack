var _ = require('underscore');

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {

};

var Player = function(username) {
  this.username = username;
  this.id = this.generateId();
  this.pile = [];
};

Player.prototype.generateId = function() {
  function id() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return id() + id();
};

var Game = function() {
  this.Card = Card;
  this.Player = Player;
  this.isStarted = false;
  this.currentPlayer = null;
  this.players = {};
  this.playerOrder = [];
  this.pile = [];
};

Game.prototype.addPlayer = function(username) {
  if (this.isStarted) throw new Error("Game is already started!");
  for (var i in this.players) {
    if (this.players[i].username === username) {
      throw new Error("Non-unique username!");
    }
  }
  var player = new Player(username);
  this.playerOrder.push(player.id);
  return (this.players[player.id] = player).id;
};

Game.prototype.nextPlayer = function(playerId) {
  if (!this.isStarted) throw new Error("Game is not started!");
  var currentPlayerPos = this.playerOrder.indexOf(this.currentPlayer);
  var nextPlayer = (currentPlayerPos === this.playerOrder.length - 1) ? 0 : currentPlayerPos + 1;

  nextPlayer += _.findIndex(this.playerOrder.slice(nextPlayer), function(n) {
    return this.players[n].pile.length > 0;
  }.bind(this));


  this.currentPlayer = this.players[this.playerOrder[nextPlayer]].id;
};

Game.prototype.startGame = function() {
  if (this.isStarted) throw new Error("Game is already started!");
  if (this.playerOrder.length < 2) throw new Error("Not enough players!");
  this.isStarted = true;

  // Create the Deck
  var suits = {0: "hearts", 1: "spades", 2: "clubs", 3: "diamonds"};
  for(var i in suits) {
    for(var j = 1; j <= 13; j++) {
      this.pile.push(new Card(suits[i], j));
    }
  }
  
  // Shuffle the Deck
  this.pile = _.shuffle(this.pile);

  // Distribute from pile
  var count = Math.floor(this.pile.length / _.keys(this.players).length);
  for(var i = 0; i < count; i++) {
    for(var j in this.players) {
      this.players[j].pile.push(this.pile.pop());
    }
  }
  this.currentPlayer = this.playerOrder[0];
};

Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) throw new Error("Game is not started!");
  if(this.players[playerId].pile.length === 52) {
    this.isStarted = false;
    return true;
  }
  return false;
};

Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) throw new Error("Game is not started!");
  if (this.currentPlayer !== playerId) {
    throw new Error("Not " + this.players[playerId].username + "'s turn!");
  }
  if (this.players[playerId].pile.length === 0) {
    throw new Error(this.players[playerId].username + " has no cards!");
  }
  this.pile.push(this.players[playerId].pile.pop());
  this.nextPlayer(playerId);
};

Game.prototype.slap = function(playerId) {
  var playerPile = this.players[playerId].pile;
  var n = this.pile.length - 1;
  if (!this.isStarted) throw new Error("Game is not started!");
  if (this.pile[n].value === 11 
    || this.pile[n].value === this.pile[n - 1].value
    || this.pile[n].value === this.pile[n - 2].value) {
    this.players[playerId].pile = playerPile.concat(this.pile);
    this.pile = [];
    return this.isWinning(playerId);
  } else {
    this.pile = this.pile.concat([playerPile.pop(), playerPile.pop(), playerPile.pop()]);
    return false;
  }
};

module.exports = Game;