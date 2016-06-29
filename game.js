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


// Make sure the game is not started and the username is valid
// Add Player to playerOlder
// return player id 
Game.prototype.addPlayer = function(username) {

};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next! 

Game.prototype.nextPlayer = function() {
 
};


/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile 
*/
Game.prototype.startGame = function() {
  
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile 
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  
};

module.exports = Game;
