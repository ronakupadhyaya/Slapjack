var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  var faceCards = {1: "Ace", 11: "Jack", 12: "Queen", 13:"King"}
   return (faceCards[this.value]  || this.value) + " of " + this.suit
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
if(this.isStarted) {
  throw new Error("Error, the game already started")
}
if(username.trim().length === 0 || !username){
  throw new Error("User cannot be blank")
}
for(var i in this.players){
  if (this.players[i].username === username){
    throw new Error("User already exists")
  }
}
var player = new Player(username);
this.playerOrder.push(player.id);
this.players[player.id] = player // push to object
this.persist()
return player.id ;
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
if (!this.isStarted) {
   throw new Error("Game has not already started");
 }
 var currentPlayerPos = this.playerOrder.indexOf(this.currentPlayer);

 var nextPlayer = 0;
 if (currentPlayerPos !== this.playerOrder.length - 1) {
   nextPlayer = currentPlayerPos + 1;
 }

 nextPlayer += _.findIndex(this.playerOrder.slice(nextPlayer), function(n) {
   return this.players[n].pile.length > 0;
 }.bind(this));

 this.currentPlayer = this.players[this.playerOrder[nextPlayer]].id;


}
/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {
if(this.isStarted) {
  throw new Error("Error, the game already started");
};
if(this.playerOrder.length < 2){
  throw new Error("Error, the game has fewer than two people added")
}
this.isStarted = true;
var deck = [];
var suits = {1: "Diamonds", 2: "Hearts", 3: "Spades", 4: "Clubs"}
for (var i in suits){
  var values = {1: "Ace", 2: "2", 3:"3", 4:"4", 5:"5", 6:"6", 7:"7", 8:"8", 9:"9", 10:"10", 11:"Jack", 12:"Queen", 13:"King"}
  for (var j in values){
    deck.push(new Card (suits[i], values[j]))

  }
 }
 var shuffleDeck = _.shuffle(deck)
 var playerIds = Object.keys(this.players)


for (var i=0 ; i<52; i++){
  var player = this.players[playerIds[i % playerIds.length]]
  player.pile.push(shuffleDeck[i])
}
this.currentPlayer = this.playerOrder[0]
}



// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if(!this.isStarted) {
    throw new Error("Error, the game already started");
  };
  if(this.players[playerId].pile.length + this.pile.length === 52){
    this.isStarted = false;
    this.pile = [];

    return true
  } else {
    return false
  }
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
if(!this.isStarted) {
  throw new Error("Error, the game has not started");
};
if(this.currentPlayer !== playerId){
  throw new Error("Not your turn, respect the rules!");
}
if(this.players[playerId].pile.length === 0){
  throw new Error("You already lost, looser!");
}

var popped = this.players[playerId].pile.pop();
this.pile.push(popped);
this.nextPlayer();
return popped.toString()

};
// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
if(!this.isStarted) {
  throw new Error("Error, the game already started");
};

var p = this.pile;
if(p.length >= 1 &&p[p.length-1].value === "Jack" ||
   p.length >= 2 &&p[p.length-1].value === p[p.length-2].value ||
   p.length >= 3 &&p[p.length-1].value === p[p.length-3].value){
   
   while(this.pile.length > 0 ){
     this.players[playerId].pile.push(this.pile.pop())
   }
      var slapObject =  {
      winning : this.isWinning(playerId),
      message : "got the pile!" 
      } 
   return slapObject
   } else {

    this.pile.push(this.players[playerId].pile.pop());
    this.pile.push(this.players[playerId].pile.pop());
    this.pile.push(this.players[playerId].pile.pop());

    var slapObject = {
    winning : false,
    message : "You lost 3 cards" }
}
return slapObject
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
