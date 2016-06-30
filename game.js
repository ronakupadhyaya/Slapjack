var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  return (this.value + " of " + this.suit);
};

var Player = function(username) {
  this.username = username;
  this.id = this.generateId();
  this.pile = [];
};

var makeDeck = function(){
  var deck = [];
  var card = null;
  var suits = ["spades", "hearts", "clubs", "diamonds"]
  for(var i = 0; i < suits.length; i++ ){
      for (var j=1; j < 14; j++){
        if(j = 1)
        {
          card = new Card(suits[i], "ace");
          deck.push(card);
        }
        else if(j = 11)
        {
          card = new Card(suits[i], "jack");
          deck.push(card);
        }
        else if(j = 12)
        {
          card = new Card(suits[i], "queen");
          deck.push(card);
        }
        else if(j = 13)
        {
          card = new Card(suits[i], "king");
          deck.push(card);
        }
        else
        {
          card = new Card(suits[i], j);
          deck.push(card);
        }
      }
  }
  return deck;
}

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
if (this.isStarted)
{
   throw "Game in Progress"
}
 else if (username.length === 0)
{
   throw "Enter a username"
}
else{
 for (var i = 0; i < this.playerOrder.length; i++){
   if (this.playerOrder[i].username === username){
     throw "Username not unique"
     }
   }
   var newPlayer = new Player(username);
   this.playerOrder.push(newPlayer);
   // this.players.push(newPlayer);
   return newPlayer.id;
}
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
if(!this.isStarted)
{
  throw "Start a game first please";
}
else
{
var ablePlayers = [];

for(var i = 0; i < this.playerOrder.length; i++){
  if(this.playerOrder[i].pile.length !== 0 || this.playerOrder[i].username === this.currentPlayer.username){
    ablePlayers.push(this.playerOrder[i])
  }
}

for (var i = 0; i < ablePlayers.length; i++)
{
  if (ablePlayers[i].username === this.currentPlayer.username && i < ablePlayers.length-1){
      this.currentPlayer = ablePlayers[i+1];
      return;
     }
  if(ablePlayers[i].username === this.currentPlayer.username && i === ablePlayers.length-1){
      this.currentPlayer = ablePlayers[0];
      return;
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
if(this.isStarted)
  {
      throw "Game has already started";
  }
if(this.playerOrder.length < 2)
  {
      throw "Not enough players";
  }
else
{
  this.isStarted = true;
  this.currentPlayer=this.playerOrder[0];
  var deck = makeDeck();
  deck = _.shuffle(deck);
  var remainder = deck.length%this.playerOrder.length;
  for(var i = 0; i < remainder; i++){
    this.pile.push(deck.pop());
  }
  var loop = deck.length/this.playerOrder.length;
  for(var j = 0; j < loop; j++){
      for(var k = 0; k <this.playerOrder.length; k++)
        this.playerOrder[k].pile.push(deck.pop());
  }
}

};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
if(!this.isStarted)
  {
      throw "Game has not started";
  }
for(var i = 0; i < this.playerOrder.length; i++)
{
  if(this.playerOrder[i].pile.length === 52 && this.playerOrder[i].id === playerId){
    return true;
  }
}
return false;

};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
if(!this.isStarted)
  {
      throw "Game has not started";
  }
if(this.currentPlayer.id !== playerId){
  throw "It is not your turn. Calm down";
}
if(this.currentPlayer.pile.length === 0){
  throw "You have no cards";
}
var card = this.currentPlayer.pile.pop();
this.pile.push(card);
this.nextPlayer();
return card.toString();


};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
var player = {};
for(var i = 0; i < this.playerOrder.length; i++){
  if(this.playerOrder[i].id === playerId){
    player = this.playerOrder[i];
  }
}
if(!this.isStarted)
  {
      throw "Game has not started";
  }
var slap = false;
if ((this.pile.length > 0 && this.pile[this.pile.length-1].value === 11) ||
  (this.pile.length > 1 && this.pile[this.pile.length-2].value === this.pile[this.pile.length-1].value) ||
  (this.pile.length > 2 && this.pile[this.pile.length-3].value === this.pile[this.pile.length-1].value)){
  slap = true;
};
if(slap)
{
var pileLength = this.pile.length; 
for (var j = 0; j < this.pileLength; i++)
  {
  player.pile.push(this.pile.pop());
  }
player.pile = _.shuffle(player.pile);
return {winning: this.isWinning(player.id), message: "got the pile"};
}
  else
  {
    var array = [];
    var reversePile = [];
  if(player.pile.length > 3)
  {
    for (var i = 0; i < 3; i++){
      array.push(player.pile.pop());
    }
  }
  else (player.pile.length > 0)
  {
    for (var i = 0; i < player.pile.length; i++){
      array.push(player.pile.pop());
    }
  }
    for(var j = 0; j < pileLength; j++){
      reversePile.push(this.pile.pop());
    }
    for(var j = 0; j < pileLength; j++){
      array.push(reversePile.pop());
    }
    this.pile = array;
    return {winning: false, message: "lost 3 cards"}
  }
}



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
