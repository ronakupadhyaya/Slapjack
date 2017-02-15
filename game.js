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
    val = 'ace';
  } else if (this.value === 11) {
    val = 'jack';
  } else if (this.value === 12) {
    val = 'queen';
  } else if (this.value === 13) {
    val = 'king';
  } // otherwise don't change anything

  return val + ' of ' + this.suit;

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
  this.playerOrder = []; // consists of player ids
  this.pile = [];
};


// Make sure the game is not started and the username is valid
// Add Player to playerOrder
// return player id
Game.prototype.addPlayer = function(username) {
  if(this.isStarted) {
    throw 'Error: game already started'
  } else if (username.length === 0) {
    throw 'Error: invalid username'
  } else {
    for(var key in this.players){
      if(this.players[key].username === username) {
        throw 'Error: username already exists'
      }
    }
  }
  var player = new Player(username);
  this.players[player.id] = player;
  this.playerOrder.push(player.id);
  // console.log(this.playerOrder);
  return player.id
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if(!this.isStarted) {
    throw "Error: game not started!"
  } else {
    var self = this;
    var findNextPlayer = function(playerId) {
      // var tempId = self.playerOrder[(self.playerOrder.indexOf(playerId) + 1)];
      var tempIndex = self.playerOrder.indexOf(playerId);
      var nextId = (tempIndex === (self.playerOrder.length - 1) ? self.playerOrder[0] : self.playerOrder[tempIndex+1]);
      var obj = self.players[nextId];
      if (obj.pile.length !== 0) {
        self.currentPlayer = nextId;
        return;
      } else {
        findNextPlayer(nextId);
      }
    }
    // console.log(this.currentPlayer)
    findNextPlayer(this.currentPlayer);
  }
};

//// GOOD COPY
// Game.prototype.nextPlayer = function() {
//   if(!this.isStarted) {
//     throw "Error: game not started!"
//   } else {
//     var nextPlayer = function(playerId) {
//       // console.log(playerId);
//       console.log(this.playerOrder);
//       // console.log(this.players)
//       var tempId = this.playerOrder[(this.playerOrder.indexOf(playerId) + 1)];
//       var nextId = (this.playerOrder.indexOf(tempId)  >= this.playerOrder.length ? this.playerOrder[0] : tempId);
//       var obj = this.players[nextId];
//       if (obj.pile.length !== 0) {
//         this.currentPlayer = nextId;
//         return;
//       } else {
//         nextPlayer(nextId);
//       }
//     }
//     // console.log(this.currentPlayer)
//     nextPlayer(this.currentPlayer);
//   }
// };
///// GOOD COPY

/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/

// cards
Game.prototype.createDeck = function() {
  var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  var suits = ['spades', 'clubs', 'diamonds', 'hearts'];
  var deck = [];
  for(var i = 0; i < values.length; i++) {
    for(var j = 0; j < suits.length; j++) {
      var card = new Card(suits[j], values[i]);
      deck.push(card);
    }
  }
  return deck;
}

// Game.prototype.startGame = function() {
//   var deck = this.createDeck();
//   // console.log(deck); we're good here
//   if(this.playerOrder.length < 2) {
//     throw 'Error: not enough players'
//   }
//   if(this.isStarted) {
//     throw 'Error: game already started'
//   }
//   this.isStarted = true;
//   deck = _.shuffle(deck); // array
//   // console.log('after shuffle')
//   var numCards = deck.length % this.playerOrder.length;
//   for(var i = 0; i < numCards.length; i++) {
//     deck.pop();
//   }
//   for(var key in this.players) {
//     while(deck.length > 0) {
//       this.players[key].pile.push(deck.shift())
//       console.log(deck);
//     }
//   }
//   this.currentPlayer = this.playerOrder[0];
// };

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
    throw 'Error: game has not started'
  } else if(this.players[playerId].pile.length === 52) {
    this.isStarted = false;
    return true;
  } else {
    return false;
  }
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if(!this.isStarted) {
    throw 'Error: game has not started b'
  } else if(this.currentPlayer !== playerId) {
    throw 'Error: watch yo step. Out of turn b'
  } else if(!this.players[playerId].pile.length) {
    throw 'Error: no cards b'
  } else {
    var newCard = this.players[playerId].pile.pop()
    this.pile.push(newCard) // not unshift and shift
    this.nextPlayer();
    return newCard.toString();
  }
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  console.log('this.isStarted: ', this.isStarted);
  var obj = {};
  if(!this.isStarted) {
    console.log('problem')
    throw 'Error: game has not started b'
  } else {
    console.log('fuck this ');
    var deckLength = this.pile.length;
    console.log('decklength');
    console.log(deckLength)
    if(this.pile[deckLength - 1].value === 11) {
      console.log('ay');
      this.players[playerId].pile.unshift(this.pile);
      obj = {
         result: this.isWinning(playerId),
         message: "got the pile!"
       };
       console.log('hi', obj)
      return obj;
    } else if (this.pile[deckLength-1].value === this.pile[deckLength-2].value) {
      console.log('ay');
      this.players[playerId].pile.unshift(this.pile);
      obj = {
         result: this.isWinning(playerId),
         message: "got the pile!"
       };
       console.log('hi', obj)
      return obj;
    } else if (this.pile[deckLength-1].value === this.pile[deckLength-3].value) {
      console.log('ay');
      this.players[playerId].pile.unshift(this.pile);
      obj = {
         result: this.isWinning(playerId),
         message: "got the pile!"
       };
       console.log('hi', obj)
      return obj;
    } else {
      console.log('ay');
      this.pile.push(this.players[playerId].pile.pop());
      this.pile.push(this.players[playerId].pile.pop());
      this.pile.push(this.players[playerId].pile.pop()); // use splice
      obj = {
         result: this.isWinning(playerId),
         message: "lost three cards!"
       };
       console.log('hi', obj)
      return obj;
    }
    console.log('somehow out here');
  }

  console.log('Got herreeerrere');
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
