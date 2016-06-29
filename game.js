var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
  switch (this.value) {
    case 1:
      this.value = "ace";
      break;
    case 11:
      this.value = "jack";
      break;
    case 12:
      this.value = "queen";
      break;
    case 13:
      this.value = "king"; 
    default: 
      this.value = this.value;
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
  //can be accessed with players[id]
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
  // for (var i = 0; i < this.players.length; i++) {
  //     var id = this.playerOrder[i];
  //     if (this.players[id].username == username) {
  //       throw "Pick a unique username"
  //     }
    //loop through an object, players is an object of Player objects
    //accessible by player IDs. So loop through the players object, 
    //loop through the ids, and access the playerObject through
    //this.playters[id]
    console.log(this.players)
  for (var playerIdKey in this.players) {
    if (this.players[playerIdKey].username === username) {
        throw "Not a unique username"
    }
  }
  if (this.isStarted) {
    throw "Game has already started."
  } else if (!username) {
    throw "Must enter a username"
  }
  if (!this.isStarted && username) {
      var newPlayer = new Player(username);
      //add newPlayer to this.players!!!!
      this.players[newPlayer.id] = newPlayer;
      this.playerOrder.push(newPlayer.id);
      // this.persist();
      return newPlayer.id 
  }
};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if (!this.isStarted) {
    throw "Game has not started"
  } else {
    var indexCurrent = this.playerOrder.indexOf(this.currentPlayer)
    var indexNext = indexCurrent + 1;
    if (indexNext === this.playerOrder.length) {
      indexNext = 0;
    }
    this.currentPlayer = this.playerOrder[indexNext];
  }
};


/* Make sure to
  1. Create the Deck
  2. Shuffle the Deck
  3. Distribute cards from the pile
*/
Game.prototype.startGame = function() {
  if (this.isStarted) {
    throw "Game already started"
  } else if (this.playerOrder.length < 2) {
    throw "Waiting for another player"
  } else {
    this.isStarted = true;
    for (var i = 1; i < 14; i++){
      var heart = new Card("hearts", i)
      var spades = new Card("spades", i)
      var diamonds = new Card("diamonds", i)
      var clubs = new Card("clubs", i)
      this.pile.push(heart, spades, diamonds, clubs)
    } 
    this.pile = _.shuffle(this.pile);
    var remainingCards = this.pile.length%this.playerOrder.length;
    var numPerPerson = (this.pile.length-remainingCards)/this.playerOrder.length;
    //have to bind because it's a function within a function
    //and therefore "this" doesn't work 
    this.playerOrder.forEach(function(playerId){
      for (var i = 0; i < numPerPerson; i++){
        this.players[playerId].pile.push(this.pile.pop())
      }
    }.bind(this))
    this.currentPlayer = this.playerOrder[0]
  }
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) {
    throw "Game has not started"
  }
  if (this.players[playerId].pile.length === 52) {
    this.isStarted = false;
    return true;
  } return false;
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) {
    throw "Game has not started"
  } else if (this.currentPlayer !== playerId) {
    throw "It is not your turn."
  } else if (this.players[playerId].pile.length === 0) {
    throw "You have no cards"
  } else {
    var popped = this.players[playerId].pile.pop();
    this.pile.push(popped);
    this.nextPlayer();
    return popped.toString();
  }
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {
  if (!this.isStarted) {
    throw "Game has not started"
  } else if ((this.pile[this.pile.length-1].value === 11) || (this.pile[this.pile.length-1].value === "jack") || (this.pile[this.pile.length-1].value === this.pile[this.pile.length-2].value) || (this.pile[this.pile.length-1].value === this.pile[this.pile.length-3].value)) {
      for (var i = 0; i < this.pile.length; i++){
        this.players[playerId].pile.push(this.pile.pop());
      }
      var result = this.isWinning(playerId);
      console.log("this is result" + result);
      if (result) { 
        return {winning: true, message: "got the pile!"};
      } 
    } else {
      var newArr = [];
      for (var j = 0; j < 3; j++) {
        newArr.push(this.players[playerId].pile.pop());
      }
      for (var k = 0; k < this.pile.length; k++){
        newArr.push(this.pile[k])
      }
      this.pile = newArr;
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
