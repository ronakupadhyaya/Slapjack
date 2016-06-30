var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  if(value === 1) {
    value = "Ace"
  }
  if(value === 11) {
    value = "Jack"
  }
  if(value === 12) {
    value = "Queen"
  }
  if(value === 13) {
    value = "King"
  }

  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
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
// Add Player to playerOrder
// return player id
Game.prototype.addPlayer = function(username) {
  var newPlayer = new Player(username);
  
  if (this.isStarted) {
    throw "Game already started";
  }
  if (username === "" || username === undefined) {
    throw "Please enter a valid username";
  }

  for (var key in this.players) {
    if (this.players[key].username === username) {
      throw "Username already taken";
    }
  }

  this.players[newPlayer.id] = newPlayer;
  this.playerOrder.push(newPlayer.id);

  // this.persist();
  return newPlayer.id;
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if (! this.isStarted) {
    throw "Game hasn't started yet";
  }

  var currentIndex = this.playerOrder.indexOf(this.currentPlayer); //find where the current player is in PlayerOrder

  for (var i=currentIndex + 1; i <= this.playerOrder.length; i++) {
    if (i === this.playerOrder.length) { // if at end, cycle back to beginning
      i = 0;
    }
    var player = this.players[this.playerOrder[i]];
    if(player.pile.length > 0) { // check if still in game
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
  if (this.isStarted) {
    throw "game has already started";
  }
  if (Object.keys(this.players).length < 2) {
    throw "Please add another player to start";
  }
  // populate pile with full deck of cards
  var suitArray = ['hearts', 'diamonds', 'clubs', 'spades'];
  for (var i = 1; i <= 13; i++) {
    for (var j = 0; j < suitArray.length; j++) {
      this.pile.push(new Card(suitArray[j], i));
    }
  }

  this.pile = _.shuffle(this.pile);

  //distribute the pile
  var mod = this.pile.length % Object.keys(this.players).length;
  for (var i=this.pile.length-1; i>0; i--) {
    if (this.pile.length === mod) {
      break;
    }
    else {
      for (var key in this.players) {
        this.players[key].pile.push(this.pile[i]);
        this.pile.pop();
        i--;
      }
    }
  }

  this.currentPlayer = this.playerOrder[0];
  this.isStarted = true;
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (! this.isStarted) {
    throw "Game has not yet started";
  }

  for (var key in this.players) {
    if(this.players[key].id === playerId) {
      if(this.players[key].pile.length === 52) {
        this.isStarted = false;
        return true;
      }
      else {
        return false;
      }
    }
  }
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if (! this.isStarted) {
    throw "Game has not yet started";
  }
  if (this.currentPlayer !== playerId) {
    throw "It is not your turn yet";
  }
  for(var key in this.players) {
    if(this.players[key].id === playerId) {
      if(this.players[key].pile.length === 0) {
        throw "Player has already lost the game";
      }
      else {
        this.pile.push(this.players[key].pile[this.players[key].pile.length-1]);
        this.nextPlayer();
        return this.toString(this.players[key].pile.pop());
      }
    }
  }
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if (! this.isStarted) {
    throw "Game has not yet started";
  }

  if(this.pile[this.pile.length-1].value === "Jack"
     || this.pile[this.pile.length-1].value === this.pile[this.pile.length-2].value
     || this.pile[this.pile.length-1].value === this.pile[this.pile.length-3].value) {
    for (var key in this.players) {
      if(this.players[key].id === playerId) {
        this.players[key].pile.push(this.pile);
        return {
          winning: this.isWinning(playerId),
          message: "got the pile!"
        }
      }
    }
  }
  else {
    for (var key in this.players) {
      if(this.players[key].id === playerId) {
        var splice = this.players[key].pile.splice(this.players[key].pile.length-3, 3);
        this.pile.push(splice[0]);
        this.pile.push(splice[1]);
        this.pile.push(splice[2]);
        return {
          winning: false,
          message: "lost 3 cards!"
        }
      }
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
