var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  if (this.value === 1) {
    return "Ace of " + this.suit;
  }
  if (this.value === 11) {
    return "Jack of " + this.suit;
  }
  if (this.value === 12) {
    return "Queen of " + this.suit;
  }
  if (this.value === 13) {
    return "King of " + this.suit;
  }
  return this.value + " of " + this.suit;
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
  if (this.isStarted) {
    throw "Game is in process";
  }
  if (!username) {
    throw "Please enter a username";
  }
  for (var key in this.players) {
    if (this.players[key].username === username) {
      throw "Username taken";
    }
  }
  var newUser = new Player(username);
  this.playerOrder.push(newUser.id);
  this.players[newUser.id] = newUser;
  return newUser.id;
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if (!this.isStarted) {
    throw "Game not started"; 
  }
  for (var i = 0; i < this.playerOrder.length; i ++) {
    if (this.currentPlayer === this.playerOrder[this.playerOrder.length - 1]) {
      this.currentPlayer = this.playerOrder[0];
      return;
    } else {
      this.currentPlayer = this.playerOrder[i+1];
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
  if (this.isStarted) {
    throw "Game is in process";
  }
  if (this.playerOrder.length < 2) {
    throw "Not enough players";
  }
  this.isStarted = true;
  var value = [1,2,3,4,5,6,7,8,9,10,11,12,13];
  var suit = ["diamonds", "clubs", "hearts", "spades"];
  for (var i = 0; i < value.length; i ++) {
    for (var j = 0; j < suit.length; j ++) {
      var newCard = new Card(suit[j], value[i]);
      this.pile.push(newCard);
    }
  }
  this.pile = _.shuffle(this.pile);
  var cards = Math.floor(52 / this.playerOrder.length);
  var that = this;
  _.each(this.players, function(player) {
    while(player.pile.length < cards) {
      player.pile.push(that.pile.pop());
    }
  });
  this.currentPlayer = this.playerOrder[0];
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) {
    throw "Game not started";
  }
  if (this.players[playerId].pile.length === 52) {
    this.isStarted = false;
    return true;
  }
  if (this.players[playerId].pile.length + this.pile.length === 52) {
    this.isStarted = false;
    return true;
  }
  return false;
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) {
    throw "Game not started";
  }
  if (playerId !== this.currentPlayer) {
    throw "Not your turn";
  }
  if (this.players[playerId].pile.length === 0) {
    throw "You can't play";
  }
  this.pile.push(this.players[playerId].pile.pop());
  this.nextPlayer();
  return this.pile[this.pile.length - 1].toString();
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if (!this.isStarted) {
    throw "Game not started";
  }
  var pile = this.pile;
  if (pile.length >= 1 && pile[pile.length - 1].value === 11 || 
      pile.length >= 2 && pile[pile.length - 1].value === pile[pile.length - 2].value || 
      pile.length >= 3 && pile[pile.length - 1].value === pile[pile.length - 3].value) {
      while (pile.length) {
        this.players[playerId].pile.unshift(this.pile.pop());
      }
    // this.nextPlayer();
      return {
        winning: this.isWinning(playerId),
        message: "got the pile!"
      };
    } 
    var counter = 0;
    while (counter < 3) {
      this.pile.push(this.players[playerId].pile.pop());
      counter++;
    }
    // this.nextPlayer();
    return {winning: false, message: "lost 3 cards!"}
  
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
