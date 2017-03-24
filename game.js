var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  var val = this.value;
  if(this.value === 1) {
    val = "ace"
  } else if(this.value === 11) {
    val = "jack"
  } else if (this.value === 12) {
    val = "queen"
  } else if (this.value === 13) {
    val = "king"
  }
  return val + " of " + this.suit
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
  var match = false;
  for(var i in this.players) {
    if(username === this.players[i].username) {
      match = true;
    }
  }

  if(this.isStarted) {
    throw "Error: game in progress"
  } else if (username.length === 0) {
    throw "Error: please enter a username"
  } else if (match) {
    throw "Error: username already exists"
  } else {
    var p = new Player(username);
    this.playerOrder.push(p.id);
    this.players[p.id] = p;
    return p.id;
  }
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if(!this.isStarted) {
    throw "Error: game not started!"
  } else {
    var self = this;
    var findNextPlayer = function(playerId) {
      var tempIndex = self.playerOrder.indexOf(playerId);
      var nextId = (tempIndex === self.playerOrder.length-1 ? self.playerOrder[0] : self.playerOrder[tempIndex+1]);
      var obj = self.players[nextId];
      if (obj.pile.length !== 0) {
        self.currentPlayer = nextId;
        return;
      } else {
        findNextPlayer(nextId);
      }
    }
    findNextPlayer(this.currentPlayer);
  }
};

/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {
  if(this.isStarted) {
    throw "Error: game is already started"
  } else if (this.playerOrder.length < 2) {
    throw "Error: not enough players"
  } else {
    this.isStarted = true;
    this.currentPlayer = this.playerOrder[0];

    //create deck
    var deck = [];
    var suits = ['hearts','diamonds','clubs','spades'];
    var vals = [1,2,3,4,5,6,7,8,9,10,11,12,13];
    for(var i = 0; i < suits.length; i++) {
      for(var j = 0; j < vals.length; j++) {
        var card = new Card(suits[i], vals[j]);
        deck.push(card);
      }
    }

    //randomInt function
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    //shuffle deck
    var shuffledDeck = [];

    while(deck.length) {
      shuffledDeck.push(deck.splice(getRandomInt(0, deck.length), 1)[0])
    }
    deck = shuffledDeck;

    //distribute deck
    var startingPile = deck.length%this.playerOrder.length
    for(var i = 0; i < startingPile; i++) {
      this.pile.push(deck.shift());
    }
    while(deck.length) {
      for(var i in this.players) {
        this.players[i].pile.push(deck.pop());
      }
    }
  }
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if(!this.isStarted) {
    throw "Error: game not started!"
  } else if (this.players[playerId].pile.length === 52) {
    this.isStarted = false;
    return true;
  } else {
    return false;
  }
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if(!this.isStarted) {
    throw "Error: game not started!"
  } else if (this.currentPlayer !== playerId) {
    throw "Error: not your turn!"
  } else if (this.players[playerId].pile.length === 0) {
    throw "Error: you have no cards!"
  } else {
    var newCard = this.players[playerId].pile.pop();
    this.pile.push(newCard);
    this.nextPlayer();
    return newCard.toString();
  }
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if(!this.isStarted) {
    throw "Error: game not started!"
  } else {
    var deckLength = this.pile.length; //TODO: This can be more than 52 so we need to fix it when all the cards are in the pile
    if(this.pile[deckLength-1].value === 11) {
      this.players[playerId].pile.unshift(this.pile)
      return {result: this.isWinning(playerId), message: "got the pile!"};
    } else if (this.pile.length > 1 && this.pile[deckLength-1].value === this.pile[deckLength-2].value) {
      this.players[playerId].pile.unshift(this.pile)
      return {result: this.isWinning(playerId), message: "got the pile!"};
    } else if (this.pile.length > 2 && this.pile[deckLength-1].value === this.pile[deckLength-3].value) {
      this.players[playerId].pile.unshift(this.pile)
      return {result: this.isWinning(playerId), message: "got the pile!"};
    } else {
      this.pile.push(this.players[playerId].pile.pop());
      this.pile.push(this.players[playerId].pile.pop());
      this.pile.push(this.players[playerId].pile.pop());
      return {result: this.isWinning(playerId), message: "lost 3 cards!"};
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
