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
     this.value = 'ace';
     break;
     case 11:
     this.value = 'jack';
     break;
     case 12:
     this.value = 'queen';
     break;
     case 13:
     this.value = 'king';
     break;
     default:
     this.value = this.value;
     break;
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
  // You should be able to access Players from this object with players[id].
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

  if (this.isStarted) {
    throw "The game has already started";
  }
  else if (!username) {
    throw "Not a valid username";
  }
  else {

   if (this.players){
      for (var playerId in this.players) {
    
      if (this.players[playerId].username === username) {
        throw "This username has been taken";
      }
    }
   } 

    var newPlayer = new Player(username);
    this.players[newPlayer.id] = newPlayer;
    this.playerOrder.push(newPlayer.id);
    // this.persist();
    return newPlayer.id;
   
 }

};


// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {
  if (!this.isStarted) {
    throw "Game has not started"
  }
  else {
    var indexCurrent = this.playerOrder.indexOf(this.currentPlayer);
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
      throw "Game has already started";
    }
    else if (this.playerOrder.length < 2) {
      throw "Ask a friend to play!";
    }
    else {
      this.isStarted = true;

      for (var i = 1; i < 14; i++) {
      
          var heart = new Card("hearts", i);
          var spades = new Card("spades", i);
          var diamonds = new Card("diamonds", i);
          var clubs = new Card("clubs", i);
          this.pile.push(heart, spades, diamonds, clubs);
      }
      
       this.pile = _.shuffle(this.pile);
       var rem = this.pile.length % this.playerOrder.length;
     
       var numPerPerson = (this.pile.length - rem) / this.playerOrder.length;
       this.playerOrder.forEach(function(playerId) {
        
        for (var j = 0; j < numPerPerson; j++) {
         
          this.players[playerId].pile.push(this.pile.pop());
          
        }
       }.bind(this));


       this.currentPlayer = this.playerOrder[0];
    }
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
  if (!this.isStarted) {
    throw "Game has not started";
  }
  else {
      if (this.players[playerId].pile.length === 52) {
        this.isStarted = false;
        return true;
      }
      return false;
    
  }
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {
  if (!this.isStarted) {
    throw "Game has not started";
  }
  else if (this.currentPlayer !== playerId) {
    throw "It's not your turn yet. Chill out bro."
  }
  else if (this.players[playerId].pile.length === 0) {
  
    this.nextPlayer();
    throw "You ran out of cards. Can't play anymore"
  }
  else {
    
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
    throw "The game has not started"
  }
  else if ((this.pile[this.pile.length-1].value === 11) || (this.pile[this.pile.length-1].value === "jack") || 
    (this.pile[this.pile.length-1].value === this.pile[this.pile.length-2].value) ||
     (this.pile[this.pile.length-1].value === this.pile[this.pile.length-3].value)) {
        for (var k = 0; k < this.pile.length; k++) {
           this.players[playerId].pile.push(this.pile.pop());
        }
       var result = this.isWinning(playerId);
       
       if (result) {
        return {winning: true, message: "got the pile!"};
       } 
  }
  console.log('CRAP');
        var newArr = [];
        for (var j=0; j < 3; j++) {
         newArr.push(this.players[playerId].pile.pop());
        }
        for (var i = 0; i < this.pile.length; i++) {
          newArr.push(this.pile[i]);
        }

        this.pile = newArr;
         console.log('survival');
        return {winning: false, message: "lost 3 cards!"};

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
