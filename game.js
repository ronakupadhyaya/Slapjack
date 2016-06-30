var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  var faces = {1: "Ace", 11: "Jack", 12: "Queen", 13: "King"};
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
// Add Player to playerOlder
// return player id
Game.prototype.addPlayer = function(username) {
  if(this.isStarted) {
    throw new Error("Game is already started");
  };
  if(!username || username.trim().length === 0) {
    throw new Error("Username is empty");
  }
  for(var key in this.players) {
    if(this.players[key].username === username) {
      throw new Error("Username is already taken");
    };
  };
  var p = new Player(username);
  this.playerOrder.push(p.id);
  this.players[p.id] = p;
  this.persist();

  return p.id;


};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if(!this.isStarted) {
    throw new Error("Game hasn't started yet!");
  };

  var currentPlayerPos = this.playerOrder.indexOf(this.currentPlayer);

  var check = function(currentPlayerPos) {
    if (currentPlayerPos === this.playerOrder.length - 1) {
      var nextPlayerPos = 0;
      var nextPlayerId = this.playerOrder[0]
    } else {
      var nextPlayerPos = currentPlayerPos + 1;
      var nextPlayerId = this.playerOrder[currentPlayerPos +1];
    };

    return [nextPlayerPos, nextPlayerId];
  }.bind(this);

  var nextPlayer = check(currentPlayerPos);

  while (this.players[nextPlayer[1]].pile.length === 0) {
    nextPlayer = check(nextPlayer[0]);
  };

  this.currentPlayer = nextPlayer[1];
};


/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {
  if(this.isStarted) {
    throw new Error("Game is already started");
  };
  if(this.playerOrder.length < 2) {
    throw new Error("Must have at least two players to play")
  };
  this.isStarted = true;
  var suit = ["Hearts", "Diamonds", "Spades", "Clubs"];
  var values = [1,2,3,4,5,6,7,8,9,10,11,12,13];

  for (var i = 0; i < suit.length; i++) {
    for (var j = 0; j < values.length; j++) {
        var c = new Card (suit[i], values[j]);
        this.pile.push(c);
    }
  }

  this.pile = _.shuffle(this.pile);
  var inPile = this.pile.length  % this.playerOrder.length;
  var dist = this.pile.length - inPile;
  var per = dist / this.playerOrder.length;
  for (var i = 0; i < per; i++) {
    for (var j in this.players) {
      this.players[j].pile.push(this.pile.pop())
    }
  }

  this.currentPlayer = this.playerOrder[0];
  this.persist();
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if(!this.isStarted) {
    throw new Error("Game hasn't started yet!");
  };

  if(this.players[playerId].pile.length === 52 || this.players[playerId].pile.length + this.pile.length === 52) {
      this.isStarted = false;
      this.currentPlayer = null;
      this.players = {};
      this.playerOrder = [];
      this.pile = [];
      this.persist();
    return true;
  };

  this.persist();
  return false;
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if(!this.isStarted) {
    throw new Error("Game hasn't started yet!");
  };
  if(this.currentPlayer != playerId) {
    throw new Error("Stop trying to play a card out of turn!");
  };
  if(this.players[playerId].pile.length === 0) {
    throw new Error("You're out of cards!");
  };

  var c = this.players[playerId].pile.pop();
  this.pile.push(c);

  this.nextPlayer(playerId);

  return c.toString();

};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if(!this.isStarted) {
    throw new Error("Game is already started");
  };
  console.log(this.pile);
  console.log(this.pile[this.pile.length-1]  + "should be an object");
  console.log(this.pile[this.pile.length-1].value + "should be a value");
  if(this.pile[this.pile.length-1].value === 11 || 
    this.pile.length > 1 && this.pile[this.pile.length-1].value === this.pile[this.pile.length-2].value ||
    this.pile.length > 2 && this.pile[this.pile.length-1].value === this.pile[this.pile.length-3].value ) {
      this.players[playerId].pile = this.pile.concat(this.players[playerId].pile)
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: "got the pile!"
      }
    } else {
      var one = this.players[playerId].pile.pop()
      var two = this.players[playerId].pile.pop()
      var three = this.players[playerId].pile.pop()
      var lostCards = [three, two, one];
      this.pile = lostCards.concat(this.pile);
      this.persist();
      return {
        winning: false,
        message: "lost 3 cards!"
      };
    };
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
