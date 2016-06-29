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
  this.persist();
};

Game.prototype.addPlayer = function(username) {
  if (this.isStarted) throw new Error("Game is already started!");
  if (!username || username.trim().length === 0) throw new Error("Invalid username!");
  for (var i in this.players) {
    if (this.players[i].username === username) {
      throw new Error("Non-unique username!");
    }
  }
  var player = new Player(username);
  this.playerOrder.push(player.id);
  this.players[player.id] = player
  this.persist();
  return player.id;
};

Game.prototype.nextPlayer = function(playerId) {
  if (!this.isStarted) throw new Error("Game is not started!");
  var currentPlayerPos = this.playerOrder.indexOf(this.currentPlayer);
  var nextPlayer = (currentPlayerPos === this.playerOrder.length - 1) ? 0 : currentPlayerPos + 1;

  nextPlayer += _.findIndex(this.playerOrder.slice(nextPlayer), function(n) {
    return this.players[n].pile.length > 0;
  }.bind(this));

  this.currentPlayer = this.players[this.playerOrder[nextPlayer]].id;
  this.persist();
};

Game.prototype.startGame = function() {
  if (this.isStarted) throw new Error("Game is already started!");
  if (this.playerOrder.length < 2) throw new Error("Not enough players!");
  this.isStarted = true;

  // Create the Deck
  var suits = {0: "hearts", 1: "spades", 2: "clubs", 3: "diamonds"};
  for(var i in suits) {
    for(var j = 1; j <= 13; j++) {
      this.pile.push(new Card(suits[i], j));
    }
  }
  
  // Shuffle the Deck
  this.pile = _.shuffle(this.pile);

  // Distribute from pile
  var count = Math.floor(this.pile.length / _.keys(this.players).length);
  for(var i = 0; i < count; i++) {
    for(var j in this.players) {
      this.players[j].pile.push(this.pile.pop());
    }
  }
  this.currentPlayer = this.playerOrder[0];
  this.persist();
};

Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) throw new Error("Game is not started!");
  if(this.players[playerId].pile.length === 52) {
    this.isStarted = false;
    this.persist();
    return true;
  }
  this.persist();
  return false;
};

Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) throw new Error("Game is not started!");
  if (this.currentPlayer !== playerId) {
    throw new Error("Not " + this.players[playerId].username + "'s turn!");
  }
  if (this.players[playerId].pile.length === 0) {
    throw new Error(this.players[playerId].username + " has no cards!");
  }
  
  var newCard = _.last(this.players[playerId].pile);
  this.pile.push(this.players[playerId].pile.pop());
  this.nextPlayer(playerId);
  return {
    card: newCard,
    cardString: newCard.toString(),
  }
};

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

// This is a function that takes a vanilla JavaScript object and
// updates this Card based on it.
Card.prototype.fromObject = function(object) {
  this.value = object.value;
  this.suit = object.suit;
}

// This is a function that turns this card into a JavaScript object.
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