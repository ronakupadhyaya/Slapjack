var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  var faces = {
    1:"Ace", 
    11:"Jack", 
    12:"Queen",
    13:"King"
  }
  return (faces[this.value] || this.value) + " of " + this.suit;
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
    throw "game is started"
  }
    var p = new Player(username);
    var un = p.username;
    var id = p.id;
    for(var x in this.players){
      if(this.players[x].username === un){
        throw "Error, Username already exists"
   }   
}
      if(!this.players[id]){
        this.players[id] = p;
        this.playerOrder.push(id);
        return id;
}
};

// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  var currentIndex = this.playerOrder.indexOf(this.currentPlayer);
  for(var i = currentIndex + 1; i <= this.playerOrder.length; i++){
    // if(this.playerOrder[i] === this.currentPlayer){
    //   return this.playerOrder[i] + 1;
    // }
    if (i === this.playerOrder.length) {
      i = 0;
    }

    var playerId = this.playerOrder[i];
    var player = this.players[playerId];
    if (player.pile.length > 0) {
      this.currentPlayer = player.id;
      return;
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
  throw "Game is started"
 };
 if(this.playerOrder.length < 2){
  throw "Need more players"
 }
 var value = [1,2,3,4,5,6,7,8,9,10,11,12,13];
 var suit = ["Spades", "Clubs", "Diamonds", "Hearts"];
 for(var n in value){
  for(var s in suit){
    var c = new Card(value[n], suit[s]) 
      this.pile.push(c);
  }
 }
 var hand = _.shuffle(this.pile);
 // console.log(hand);
 // console.log(this.playerOrder.length);
 var d = Math.floor(hand.length/this.playerOrder.length);;
  for(var i = 0; i < d; i++){
    for(var key in this.players){
      var card = hand.pop();
      // console.log(this.players[key]);
      this.players[key].pile.push(card)
    }
  }
  // console.log(this.players);
  this.pile = hand;
  this.currentPlayer = this.playerOrder[0];
  this.isStarted = true;
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if(!this.isStarted){
  throw "Game has not started"
 };
 if(this.players[playerId].pile.length === 52){
  return true;
 } else{
  return false;
 }
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if(!this.isStarted){
    throw "Game has not started"
  };
  if(this.currentPlayer !== playerId){
    throw "error"
  };
  if(this.players[playerId].pile.length === 0){
    throw "You're fucked"
  }
  var card = _.last(this.players[playerId].pile);
  this.pile.push(card)
  this.nextPlayer();
  return card.toString();
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
var playerPile = this.players[playerId].pile;
  var pile = this.pile;
  var n = this.pile.length - 1;
  if (!this.isStarted) throw new Error("Game is not started!");
  console.log(pile);

  if ((pile.length > 0 && pile[n].value === 11 )
    || (pile.length > 1 && pile[n].value === pile[n - 1].value)
    || (pile.length > 2 && pile[n].value === pile[n - 2].value)) {
    this.players[playerId].pile = playerPile.concat(pile);
    this.pile = [];
    return {
      winning: this.isWinning(playerId),
      message: "got the pile!"
    }
  } else {
    this.pile = this.pile.concat([playerPile.pop(), playerPile.pop(), playerPile.pop()]);
    this.persist();
    return {
      winning: false,
      message: "lost three cards!"
    };
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
