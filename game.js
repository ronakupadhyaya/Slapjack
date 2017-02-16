var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {

  var valueStr = "";

  if(this.value === 1){
    valueStr = "ace";
  } else if(this.value === 11){
    valueStr = "jack";
  } else if(this.value === 12){
    valueStr = "queen";
  } else if(this.value === 13){
    valueStr = "king";
  } else{
    valueStr = this.value.toString();
  }

  return valueStr + " of " + this.suit;

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
// Add Player to playerOrder
// return player id
Game.prototype.addPlayer = function(username) {

  if(this.isStarted){

    throw "Game has already started.";

  } else{

    if(username === ""){

      throw "Username is empty.";
    } 

    for(var k in this.players){

      if(this.players[k].username === username){
        throw "Username is not unique.";
      }
    }


    var newPlayer = new Player(username);

    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;

    return newPlayer.id;

  }

};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {

  if(!this.isStarted){
    throw "Game hasn't started yet.";
  }

  var currentPlayerId = this.currentPlayer;

  for(var i=0; i<this.playerOrder.length; i++){

    if(this.playerOrder[i] === currentPlayerId){
      if(i === this.playerOrder.length-1){

        this.currentPlayer = this.playerOrder[0];

      } else{
        this.currentPlayer = this.playerOrder[i+1];
      }
    }
  }

};


/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {

  if(this.isStarted){
    throw "Game has already started."
  }

  if(this.playerOrder.length < 2){
    throw "Fewer than 2 people in game."
  }

  this.isStarted = true;

  // Create a standard deck of 52 playing cards and shuffle them

  var deck = [];

  for(var j=0; j<4; j++){
    for(var i=1; i<14; i++){

      var suit = "";
      if(j === 0){
        suit = "hearts";
      }else if(j === 1){
        suit = "spades";
      }else if(j === 2){
        suit = "clubs";
      }else{
        suit = "diamonds";
      }
      var newCard = new Card(suit, i);

      deck.push(newCard);
    }
  }

  deck = _.shuffle(deck);

  while(deck.length > this.playerOrder.length){

    for(var k in this.players){
      var newCard = deck.pop();
      this.players[k].pile.push(newCard);
    }
  }

  for(var i=0; i<deck.length; i++){

    var newCard = deck.pop();
    this.pile.push(newCard);
  }

  this.currentPlayer = this.playerOrder[0];


};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {

  if(!this.isStarted){
    throw "Game hasn't started yet.";
  }

  var idToNumCards = [];

  for(var k in this.players){

    idToNumCards.push({id: this.players[k].id, numCards: this.players[k].pile.length});

  }

  var max = 0;
  var maxId;
  for(var i=0; i<idToNumCards.length; i++){

    if(idToNumCards[i].numCards > max){
      max = idToNumCards[i].numCards;
      maxId = idToNumCards[i].id;
    }
  }

  if(maxId === playerId && max === 52){
    return true;
  } else{
    return false;
  }

};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {

  if(!this.isStarted){
    throw "Game hasn't started yet.";
  }

  if(this.currentPlayer !== playerId){
    throw "Current Player ID variable does not match the passed-in Player ID.";
  }

  if(this.players[playerId].pile.length === 0){
    throw "Player corresponding to the passed-in Player ID has a pile length of zero";
  }

  var card = this.players[playerId].pile.pop();
  this.pile.push(card);
  this.nextPlayer();
  return card.toString();

};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {

  if(!this.isStarted){
    throw "Game hasn't started yet.";
  }

  var winFlag = false;

  // console.log('********************');

  // console.log(this.pile);
  // console.log(this.pile[this.pile.length - 1]);
  // console.log(this.pile[this.pile.length - 1].value);


  // console.log('********************');



  if(this.pile[this.pile.length - 1].value === 11){
    winFlag = true;
  }

  if(this.pile.length >= 2){
    if(this.pile[this.pile.length - 1].value === this.pile[this.pile.length - 2].value){
      winFlag = true;
    }
  }

  if(this.pile.length >= 3){
    if(this.pile[this.pile.length - 1].value === this.pile[this.pile.length - 3].value){
      winFlag = true;
    }
  }

  if(winFlag){
    while(this.pile.length > 0){
      var card = this.pile.pop();
      this.players[playerId].pile.push(card);
    }

    var win = this.isWinning(playerId);
    return {winning: win, message: "got the pile!"};

  } else{

    for(var i=0; i<3; i++){
      var card = this.players[playerId].pile.pop();
      this.pile.shift(card);
    }

    return {winning: false, message: "lost 3 cards!"};
    // return false;


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
