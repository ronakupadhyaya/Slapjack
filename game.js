var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  var cardstring ="";
  switch( this.value ){
    case 1:
      cardstring+="Ace";
      break;
    case 2:
      cardstring+=value;
      break;
    case 3:
      cardstring+=value;
      break;
    case 4:
      cardstring+=value;
      break;
    case 5:
      cardstring+=value;
      break;
    case 6:
      cardstring+=value;
      break;
    case 7:
      cardstring+=value;
      break;
    case 8:
      cardstring+=value;
      break;
    case 9:
      cardstring+=value;
      break;
    case 10:
      cardstring+=value;
      break;
    case 11:
      cardstring+="Jack";
      break;
    case 12:
      cardstring+="Queen";
      break;
    case 13:
      cardstring+="King";
      break;
  }
  cardstring+=" of ";
  cardstring+=this.suit;

  return cardstring;
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
  this.isStarted = false;

  this.Card = Card;
  this.Player = Player;

  this.currentPlayer = null; //string to store the ID of the current player
  this.players = {};
  this.playerOrder = [];
  this.pile = [];
};


// Make sure the game is not started and the username is valid
// Add Player to playerOrder
// return player id
Game.prototype.addPlayer = function(username) {
  if(this.isStarted){
    throw new Error("Game has already started");
  }
  if(!username){
    throw new Error("No username");
  }

  // console.log(username);
  for(id in this.players){
    // console.log('player:', player.username);
    if(this.players[id].username === username)
      throw new Error("Username already exists");
  }

  var newPlayer = new Player(username);
  this.playerOrder.push(newPlayer.id);
  this.players[newPlayer.id] = newPlayer;
  return newPlayer.id;
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
  if(this.isStarted){
    throw new Error("Game has already started");
  }
  if(this.playerOrder.length < 2){
    throw new Error("Not enough players");
  }
  this.isStarted = true;
  //Create deck and Shuffle

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



// PERSISTENCE FUNCTIONS

// Start here after completing Step 2!
// We have written a persist() function for you
// to save your game state to a store.json file.

// Determine in which gameplay functions above
// you want to persist and save your data. We will
// do a code-along later today to show you how
// to convert this from saving to a file to saving
// to Redis, a persistent in-memory datastore!

Card.prototype.fromObject = function(object) {
  this.value = object.value;
  this.suit = object.suit;
}

Card.prototype.toObject = function() {
  return {
    value: this.value,
    suit: this.suit
  };
}


Player.prototype.fromObject = function(object) {
  this.username = object.username;
  this.id = object.id;
  this.pile = object.pile.map(function(card) {
    var c = new Card();
    c.fromObject(card);
    return c;
  });
}

Player.prototype.toObject = function() {
  var ret = {
    username: this.username,
    id: this.id
  };
  ret.pile = this.pile.map(function(card) {
    return card.toObject();
  });
  return ret;
}

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
  ret.players = {};
  for (var i in this.players) {
    ret.players[i] = this.players[i].toObject();
  }
  ret.pile = this.pile.map(function(card) {
    return card.toObject();
  });
  return ret;
}

Game.prototype.fromJSON = function(jsonString) {
  this.fromObject(JSON.parse(jsonString));
}

Game.prototype.toJSON = function() {
  return JSON.stringify(this.toObject());
}

Game.prototype.persist = function() {
  if (readGame && persist.hasExisting()) {
    this.fromJSON(persist.read());
    readGame = true;
  } else {
    persist.write(this.toJSON());
  }
}

module.exports = Game;
