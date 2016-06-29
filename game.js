var _ = require('underscore');

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
};

// This is a function that takes a vanilla JavaScript object and
// updates this Card based on it.
Card.prototype.fromObject = function(object) {
  this.value = object.value;
  this.suit = object.suit;
}

// This is a function that turns this card into a JavaScript object.
Card.prototype.toObject = function() {
  return {
    value: this.value,
    suit: this.suit
  };
}

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

// Write a function that takes a JSON string and updates this
// player based on the contents of the JSON string.
Player.prototype.fromObject = function(object) {
  this.username = object.username;
  this.id = object.id;
  this.pile = object.pile.map(function(card) {
    var c = new Card();
    c.fromObject(card);
    return c;
  });
}

// Write a function that turns current player into a JSON string
// player based on the contents of the JSON string.
Player.prototype.toObject = function() {
  var ret = {
    username: this.username,
    id: this.id
  };
  ret.pile = this.pile.map(function(card) {
    return card.toOject();
  });
  return ret;
}

var Game = function() {
  this.Card = Card;
  this.Player = Player;
  this.isStarted = false;
  this.currentPlayer = null;
  this.players = {};
  this.playerOrder = [];
  this.pile = [];
};

Game.fromJson = function(jsonString) {
}

Game.prototype.addPlayer = function(username) {

};

Game.prototype.nextPlayer = function(playerId) {

};


/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {

};

Game.prototype.isWinning = function(playerId) {

};

Game.prototype.playCard = function(playerId) {

};

Game.prototype.slap = function(playerId) {

};

Game.prototype.fromObject = function(object) {
  this.isStarted = object.isStarted;
  this.currentPlayer = object.currentPlayer;
  this.playerOrder = object.playerOrder;

  this.pile = object.pile.map(function(card) {
    var c = new Card();
    c.fromObject(card);
    return c;
  });

  this.players = _.mapObject(object.players, function(player) {
    var p = new Player();
    p.fromObject(player);
    return p;
  });
}

Game.prototype.toObject = function() {
  var ret = {
    isStarted: this.isStarted,
    currentPlayer: this.currentPlayer,
    playerOrder: this.playerOrder
  };
  ret.players = this.players.map(function(player) {
    return player.toObject();
  });
  ret.pile = this.pile.map(function(card) {
    return card.toObject();
  });
  return ret;
}

Game.prototype.fromJson = function(jsonString) {
  this.fromObject(JSON.parse(jsonString));
}

Game.prototype.toJSON = function() {
  return JSON.stringify(this.toObject());
}

module.exports = Game;
