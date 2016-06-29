var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  //pull out value of card in question
  var val = this.value

  //if the card is not numerical change the val to be the proper card
  if(val===1){
    val="ace"
  }
  if(val===11){
    val=="jack"
  }
  if(val===12){
    val="queen"
  }
  if(val===13){
    val="king"
  }

  //return the card as a string of "(card value) of (suit)"
  return val+" of "+this.suit
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
  if(this.isStarted){
    throw "game already started"
  }
  if(username===null || username===""){
    throw "must ented username"
  }
  for(var i=0; i<this.playerOrder.length; i++){
    var id = this.playerOrder[i]
    if(username===this.players[id].username){
      throw "username already taken"
    }
  }
  var p = new Player(username);
  this.playerOrder.push(p.id)
  this.players[p.id]=p;
  return p.id
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if(!this.isStarted){
    throw "game hasn't started"
  }
  //find position of current player in the player Order array
  var current = this.playerOrder.indexOf(this.currentPlayer)
  //if this position is the last one in the order array, the new current player will be the first in line
  if(current===this.playerOrder.length-1){
    this.currentPlayer=this.playerOrder[0];
  }
  //otherwise it will be the next position in the order array
  else{
    this.currentPlayer=this.playerOrder[current+1];
  } 
};


/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {
  if(this.isStarted){
    throw "game already started"
  }
  if(this.playerOrder.length<2){
    throw "need more players"
  }

  //fill deck with all cards (combos of suits and values)
  var suits = ["hearts", "spades", "clubs", "diamonds"]
  var deck=[];
  for(var i=0; i<suits.length; i++){
    for(j=1; j<14; j++){
     // var c = new Card(suits[i], j)
      deck.push(new Card(suits[i], j));
    };
  };
  //set game status to started
  this.isStarted=true;
  //shuffle the deck
  deck=_.shuffle(deck);
  //determine how many cards each player can have
  var amt = parseInt(deck.length/this.playerOrder.length);
  //loop over plaeyer order to find ids
  for(var i=0; i<this.playerOrder.length; i++)
    var id = this.playerOrder[i];
  //use id to target player and add first card ini deck to their pile, iterate over the number of times
  //to match the amount of cards they should have, remove cards from deck as you go (pulling from 1st in pile only)
    for(var j=0; j<amt; j++){
      this.players[id].pile.push(deck[0]);
      deck.shift();
    };

  //give remaining cards to the game pile
  this.pile=deck;

  //set current player to first person in playre order (only need to call id)
  this.currentPlayer=this.playerOrder[0];

};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if(!this.isStarted){
    throw "game has not started"
  }

  //can't win if cards are still in game pile
  if(this.pile!==0){
    return false
  }

  //can only win if player in question has all 52 cards
  if(this.players[playerId].pile.length===52){
    this.isStarted=false;
    return true
  }

  //if condition is not met player has not won, return false
  return false

};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if(!this.isStarted){
    throw "game has not started"
  }
  if(playerId!==this.currentPlayer){
    throw "not your turn"
  }
  if(this.players[playerId].pile.length===0){
    throw "no cards"
  }
  //assuming last card in array is top of pile!!!!

  //pop out last card in users pile and push into back of game pile1
  var card = this.players[playerId].pile.pop();
  this.pile.push(card)

  //move to next player in line
  this.nextPlayer()
  return card.toString()
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if(!this.isStarted){
    throw "game not started"
  }
  ////reverse deck and assign to variable for ease
  var deck = this.pile.reverse()
  //see if slap is valid: top card jack, top 2 same, sandwich (1 and 3 same)
  if(deck[0].value===11 || deck[0].value===deck[1].value || deck[0].value===deck[1].value){
    //shift (unshift=push to front) all cards in game pile to player who slapped successfully
    for(var i=0; i<deck.length; i++){
      this.players[playerId].pile.unshift(deck[i]);
    }
    //empty out the game pile because all cards now belong to a player
    this.pile=[];
    //see if player won
    return {
      winning: this.isWinning(playerId),
      message: "got the pile"
    }
  }
  //if not valid slap player 
  else{
    //add top card of player to top of deck (back of array to back of array)
    //repeat 3 times so each of 3 top cards gets moved into the 
    this.pile.push(this.players[playerid].pile.pop());
    this.pile.push(this.players[playerid].pile.pop());
    this.pile.push(this.players[playerid].pile.pop());
    return {
      winning: false,
      message: "lost 3 cards"
    }
  }
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
