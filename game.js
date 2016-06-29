var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  return this.suit + " of " + this.value;
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
  if (this.isStarted) throw ("Game has already started");

  if (!username) throw ("username is empty");
  for (var key in this.players) {
    if (this.players[key].username === username) throw ("username already exists");
  }
  var p = new Player(username);
  this.playerOrder.push(p.id);
  this.players[p.id] = p;
  this.persist();
  return p.id;
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if (!this.isStarted) throw ('Game has not started');

  for (var i = 0; i < this.playerOrder.length; i++) {
    
    if (this.currentPlayer === this.playerOrder[i]) {
      
      if (i === this.playerOrder.length - 1) {
        this.currentPlayer = this.playerOrder[0];
      } else {
        this.currentPlayer = this.playerOrder[i + 1];
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
  if (this.isStarted) throw ("Game has already started");
  if (this.playerOrder.length < 2) throw ("there are not enough players");
  this.isStarted = true;
  for (var i = 1; i < 14; i++) {
    for (var j = 0; j < 4; j++) {

      if (j === 0) {var suit = "hearts"}
      else if (j === 1) {var suit = "spades"}
      else if (j === 2) {var suit = "clubs"}
      else {var suit = "diamonds"}
      var c = new Card(i, suit);
      this.pile.push(c);
    }
  }

  this.pile = _.shuffle(this.pile);

  while (this.pile.length > this.playerOrder.length) {
    for (var key in this.players) {
      this.players[key].pile.push(this.pile.pop())
    }
  }

  this.currentPlayer = this.playerOrder[0];
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) throw ("Game has not started");
  if (this.players[playerId].pile.length === 52) {
    this.isStarted = false
    return true;
  }
  return false;

};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) throw ("Game has not started");
  if (playerId !== this.currentPlayer) throw ("It is not your turn");
  if (this.players[playerId].pile.length === 0) throw ("you do not have any cards");
  var card = this.players[playerId].pile.pop();
  this.pile.push(card);
  this.nextPlayer();
  return card.toString();
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if (!this.isStarted) throw ("Game has not started");
  var win = false;
  if (_.last(this.pile).value === 11) {
    win = true;
  } else if (this.pile.length > 1 && _.last(this.pile).value === this.pile[this.pile.length - 2]) {
    win = true;
  } else if (this.pile.length > 2 && _.last(this.pile).value === this.pile[this.pile.length - 3]) {
    win = true;
  }

  if (win) {
    this.players[playerId].pile.concat(this.pile);
    return {winning: this.isWinning(), message: "got the pile!"};
  } else {
    var arr = [];
    for (var i = 0; i < 3; i++) {
      arr.push(this.players[playerId].pile.pop());
    }
    arr.concat(this.pile);
    this.pile = arr;
    return {winning: false, message: "lost 3 cards!"};
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
