var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

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
// Add Player to playerOrder
// return player id
Game.prototype.addPlayer = function(username) {
  if (!username) {throw new Error()}
  var _players = this.players
  if (!this.isStarted && _.reduce(this.playerOrder, function(memo,id) {
    return _players[id].username!==username && memo
  }, true)) {
    var newPlayer = new Player(username)
    this.playerOrder.push(newPlayer.id)
    this.players[newPlayer.id] = newPlayer
    this.persist()
    return newPlayer.id
  } else  {
    throw new Error()
  }
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  console.log('\nnext player called')
  if (!this.isStarted) {throw new Error()}
  var index = (this.playerOrder.indexOf(this.currentPlayer)+1)%this.playerOrder.length
  while (this.players[this.playerOrder[index]].pile.length===0) {
    index = (index+1)%this.playerOrder.length
  }
  this.currentPlayer = this.playerOrder[index]
  console.log(this.currentPlayer)
}; 

/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() { 
  console.log('\nstart game called')
  if (this.playerOrder.length<2) {
    throw new Error()
  }
  this.isStarted = true
  this.Player = this.players[this.playerOrder[0]]
  this.currentPlayer = this.playerOrder[0]
  var deck = []
  for (var i = 0; i < 52; i++) {
    deck.push(new Card(Math.floor(i/13),i%13))
  }
  deck = _.shuffle(deck)
  var index = 0
  for (var i = 0; i < 52; i++) {
    if (deck.length<this.playerOrder.length && index===0) {break}
    this.players[this.playerOrder[index]].pile.push(deck.pop())
    index = (index+1)%this.playerOrder.length
  }
  this.pile = deck
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted || this.currentPlayer !== playerId) {throw new Error()}
  return this.players[this.currentPlayer].pile.length === 52
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  console.log('\nplay card called')
  if (!this.isStarted || this.players[this.currentPlayer].pile.length===0 || this.currentPlayer!==playerId) {throw new Error()}
  this.pile.push(this.players[this.currentPlayer].pile.pop())
  this.nextPlayer()
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  console.log('\nslap called')
  if (!this.isStarted) {throw new Error()}
  console.log('past the error')
  var top = this.pile.slice(-3)
  if (top[2].value===10 || top[2].value===top[1].value || top[0].value===top[2].value) {
    this.players[playerId].pile.concat(_.shuffle(this.pile))
    console.log('pile won!')
    return {winning: this.isWinning(playerId), message:'got the pile!'}
  } else {
    console.log('cards lost!')
    this.pile.concat(this.players[playerId].pile.splice(3,3))
    return {winning:false, message:'lost three cards!'}
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
