var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  if (this.value > 1 && this.value < 11) {
    return this.value + ' of ' + this.suit;
  } else if (this.value === 1) {
    return 'ace of ' + this.suit;
  } else if (this.value === 11) {
    return 'jack of ' + this.suit;
  } else if (this.value === 12) {
    return 'queen of ' + this.suit;
  } else {
    return 'king of ' + this.suit;
  }
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
  var self = this;
  if (!!self.isStarted) {
    throw new Error("Game started!");
  }

  if (!username) {
    throw new Error("Username must not be empty!");
  }

  if (Object.keys(self.players).map(function(key) {
    return self.players[key]
  }).filter(function(item){
    return item.username === username
  }).length !== 0) {
    throw new Error("Username must be unique!")
  }

  var newPlayer = new Player(username)
  this.playerOrder.push(newPlayer.id)
  this.players[newPlayer.id] = newPlayer
  return newPlayer.id;
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if(!this.isStarted) {
    throw new Error("Game hasn't started yet!");
  }
  var comparePlayer = this.currentPlayer
  for (var i = this.playerOrder.indexOf(this.currentPlayer) + 1; i < this.playerOrder.length; i++) {
    if (this.players[this.playerOrder[i]].pile.length !== 0) {
      this.currentPlayer = this.playerOrder[i];
      break;
    };
  };
  if (comparePlayer === this.currentPlayer) {
    for (var i = 0; i < this.playerOrder.length; i++) {
      if (this.players[this.playerOrder[i]].pile.length !== 0) {
        this.currentPlayer = this.playerOrder[i];
        break;
      };
    }
  }
};

/* Make sure to
1. Create the Deck
2. Shuffle the Deck
3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {
  var players= Object.keys(this.players)
  if(this.isStarted === true) {
    throw new Error("Game has already started!")
  } else if (players.length < 2) {
    throw new Error("Game requires more than 2 people!")
  }
  this.isStarted = true;
  var suits = ['clubs', 'hearts', 'spades', 'diamonds']
  for (var j = 0; j < suits.length; j++) {
    for (var i = 0; i < 13; i++) {
      var newCard = new Card(suits[j], i)
      this.pile.push(newCard)
    };
  };
  this.pile = _.shuffle(this.pile);
  var pileLength = this.pile.length
  for (var i = 0; i < Math.floor(pileLength/players.length); i++) {
    for (var j = 0; j < players.length; j++) {
      var poppedCard = this.pile.pop()
      this.players[players[j]].pile.push(poppedCard)
    }
  }
  for (var j = 0; j < players.length; j++) {
  }
  this.currentPlayer = this.playerOrder[0]
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) {
    throw new Error("Game needs to start fool");
  }
  if (this.players[playerId].pile.length === 52) {
    this.isStarted = false;
    return true;
  }
  return false;
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) {
    throw new Error("Game needs to start fool");
  }
  if (playerId !== this.currentPlayer) {
    throw new Error("Not this players turn son");
  }
  if (this.players[playerId].pile.length === 0) {
    throw new Error("No cards in pile boi");
  }

  var poppedCard = this.players[playerId].pile.pop()
  this.pile.push(poppedCard)
  this.nextPlayer()
  return poppedCard.toString()
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  // console.log('called', this)
  // console.log('asdfasdfasdfasdfasdfasdf')
  if (!this.isStarted) {
    throw new Error("Game needs to start fool");
  }
  var testPile = this.pile.slice();
  var testCard1 = testPile.pop();
  var testCard2 = testPile.pop();
  var testCard3 = testPile.pop();
  if (!testCard1) {
    testCard1 = false
  }
  if (!testCard2) {
    testCard2 = false
  }
  if (!testCard3) {
    testCard3 = false
  }
  if (testCard1.value === 11 || testCard1.value === testCard2.value || testCard1.value === testCard3.value) {
    this.players[playerId].pile = this.pile.concat(this.players[playerId].pile);
    this.pile = [];
    return {winning: this.isWinning(playerId), message: "got the pile!"};
  } else {
    this.pile = (this.players[playerId].pile.splice(-3)).concat(this.pile)
    if (this.players[playerId].pile.length === 0) {
      this.nextPlayer()
      return {winning: false, message: "lost all cards!"}
    }
    return {winning: false, message: "lost 3 cards!"}
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
