var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
    var output = this.value + ' of ' + this.suit;
    return output;
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
    throw "game has already started";
  }

  if(!username) {
    throw "username is empty";
  }

  for (var p in this.players) {
    if (this.players.hasOwnProperty(p)) {
        if(this.players[p].username === username) {
          throw "this username has already been taken";
        }
    }
  }

  var newPlayer = new Player(username);
  this.players[newPlayer.id] = newPlayer;
  this.playerOrder.push(newPlayer.id);

  this.persist();

  return newPlayer.id;
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {

  console.log('inside nextPlayer function');

  for(var i = 0; i < this.playerOrder.length; i++) {
    if(this.playerOrder[i] === this.currentPlayer) {
      this.currentPlayer = this.playerOrder[++i];
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
  if(this.isStarted) {
    throw "game has already started";
    return;
  }

  if(this.playerOrder.length < 2) {
    throw "game has less than two people";
    return;
  }

  this.isStarted = true;

  var values = _.range(1, 14);
  var suits = ['clubs', 'diamonds', 'hearts', 'spades'];

  for(var i = 0; i < values.length; i++) {
    for(var j = 0; j < suits.length; j++) {
      var card = new Card(suits[j], values[i]);
      this.pile.push(card);
    }
  }

  this.pile = _.shuffle(this.pile);

  var remainder = 52%this.playerOrder.length;

  var toDistribute = 52-remainder;

  for(var i = 0; i < toDistribute-1; i++) {
    this.players[this.playerOrder[i%this.playerOrder.length]].pile.push(this.pile.pop());
  }

  this.currentPlayer = this.playerOrder[0];

};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if(!this.isStarted) {
    throw "game have not started yet";
    return;
  }

  var score = this.players[playerId].pile.length;
  var isWin = true;

  for (var p in this.players) {
    if (this.players.hasOwnProperty(p)) {
        if(this.players[p].pile.length >= score) {
          isWin = false;
        }
    }
  }

  if(isWin) {
    this.isStarted = false;
    return isWin;
  } else {
    return isWin;
  }

};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {

  if(!this.isStarted) {
    throw "game have not started yet";
    return;
  }

  if(this.currentPlayer !== playerId) {
    throw "it's not your turn yet your retarded";
    return;
  }

  if(this.players[playerId].pile.length === 0) {
    throw "you ran out of cards, good luck looser";
    return;
  }

  var card = this.players[playerId].pile.pop();

  this.pile.push(card);

  this.nextPlayer();

  return card.toString();
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if(!this.isStarted) {
    throw "game have not started yet";
    return;
  }

  var lastCard = this.pile[this.pile.length-1];
  var secondLastCard = this.pile[this.pile.length-2];
  var thirdLastCard = this.pile[this.pile.length-3];

  var isSlap = false;

  if(lastCard.value === 11) {
    isSlap = true;
  }

  if(lastCard.value === secondLastCard.value) {
    isSlap = true;
  }

  if(lastCard.value === thirdLastCard.value) {
    isSlap = true;
  }

  if(isSlap) {
    this.players.pile = this.pile.concat(this.players.pile);
    var winning = this.isWinning(playerId);
    return {winning: winning, message: "git the pile!"};
  } else {
    var take = [];
    take.push(this.players[playerId].pile.pop());
    take.push(this.players[playerId].pile.pop());
    take.push(this.players[playerId].pile.pop());

    this.pile = take.concat(this.pile);
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
<<<<<<< HEAD
  ret.players = _.mapObject(this.players, function(player, id) {
    return player.toObject();
  });
=======
  ret.players = {};
  for (var i in this.players) {
    ret.players[i] = this.players[i].toObject();
  }
>>>>>>> master
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
