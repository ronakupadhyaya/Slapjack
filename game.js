var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var suits = ['diamonds', 'clubs', 'hearts', 'spades'];
var cardValues = [_, 'Ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Jack', 'Queen', 'King'];

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  return cardValues[this.value] + ' of ' + this.suit;
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
  if (this.isStarted) throw 'Game has started';
  if (!username) throw 'Username is empty';
  for (var i in this.players) {
    if (this.players[i].username == username) {
      throw 'Not unique username';
    }
  }

  var player = new Player(username);
  this.players[player.id] = player;
  this.playerOrder.push(player.id);
  // this.persist();
  return player.id;
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if (!this.isStarted) throw 'Game has not started';

  // for (var i in this.playerOrder) {
  //   if (this.players[this.playerOrder[i]].pile.length > 0) {
  //     this.currentPlayer = this.playerOrder[i];
  //   }
  // }
  var i = this.playerOrder.indexOf(this.currentPlayer);
  while (true) {
    i = (i + 1) % this.playerOrder.length;
    if (this.players[this.playerOrder[i]].pile.length > 0) {
      this.currentPlayer = this.playerOrder[i];
      break;
    }
    if (i == this.playerOrder.indexOf(this.currentPlayer)) {
      break;
    }
  }
};


/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {
  if (this.isStarted) throw 'Game has started already';
  if (this.playerOrder.length < 2) throw 'Less than 2 players';

  this.isStarted = true;
  var deck = [];
  for (var i in suits) {
    for (var j = 1; j <= 13; j++) {
      deck.push(new Card(suits[i], j));
    }
  }
  var shuffledDeck = _.shuffle(deck);
  var leftover = shuffledDeck.splice(0, 52 % this.playerOrder.length);
  this.pile.push.apply(this.pile, leftover);
  for (var i = 0; i < shuffledDeck.length; i++) {
    this.players[this.playerOrder[i % this.playerOrder.length]].pile.push(shuffledDeck[i]);
  }
  this.currentPlayer = this.playerOrder[0];
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) throw 'Game has not started';

  if (this.players[playerId].pile.length == 52) {
    this.isStarted = false;
    return true;
  }
  return false;
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) throw 'Game has not started';
  if (playerId != this.currentPlayer) throw 'Not his turn';
  if (this.players[playerId].pile.length == 0) throw 'Empty pile';

  var card = this.players[playerId].pile.shift();
  this.pile.splice(0, 0, card);
  this.nextPlayer();
  return card.toString();
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if (!this.isStarted) throw 'Game has not started';
  var win1 = (this.pile[this.pile.length - 1].value == 11);
  var win2 = (this.pile[this.pile.length - 1].value == this.pile[this.pile.length - 2].value);
  var win3 = (this.pile[this.pile.length - 1].value == this.pile[this.pile.length - 3].value);
  if (win1 || win2 || win3) {
    this.players[playerId].pile.push.apply(this.players[playerId].pile, this.pile);
    this.pile = [];
    var res = {};
    res['winning'] = this.isWinning(playerId);
    res['message'] = 'got the pile!';
    res['username'] = this.players[playerId].username;
    return res;
  } else {
    var count = 0;
    for (var i in this.players[playerId].pile) {
      this.pile.push(this.players[playerId].pile[i]);
      count++;
      if (count == 3) {
        break;
      }
    }
    this.players[playerId].pile.splice(0, count);
    var res = {};
    res['winning'] = false;
    res['message'] = 'lost 3 cards!';
    res['username'] = this.players[playerId].username;
    return res;
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
    return card.toOject();
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
  ret.players = _.mapObject(this.players, function(player, id) {
    return player.toObject();
  });
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
