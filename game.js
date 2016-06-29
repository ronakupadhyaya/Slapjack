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

module.exports = Game;
