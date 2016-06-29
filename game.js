var _ = require('underscore');
var persist = require('./persist');
var readGame = false;

var Card = function(suit, value) {
  this.value = value;
  this.suit = suit;
};

Card.prototype.toString = function() {
	return this.value + 'of' + this.suit;
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
	
	// throw errors for started game and empty or invalid username
	if (this.isStarted) {
		throw 'error: game already started';
	}
	if (!username) {
		throw 'error: no username';
	}
	for (var i in this.players) {
		if (this.players[i].username === username) {
			throw 'error: duplicate username';
		}
	}

	// create new player with the username passed in
	var player = new this.Player(username);

	// add that player to the object and array of players and playerOrder
	this.players[player.id] = player;
	this.playerOrder.push(player.id);

	this.persist();
	return player.id;
}

// Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
Game.prototype.nextPlayer = function() {

	// throw an error if the game has been started
	if (!this.isStarted) {
		throw 'error: game not started';
	}

	
	// for (var key in this.players) {
	// 	if (this.players[key].pile.length === 0) {
	// 		index+=1;
	// 	}
	// 	else {
	// 	this.currentPlayer = this.playerOrder[index + 1];
	// 	}
	// }

	var index = this.playerOrder.indexOf(this.currentPlayer);
	for (var i = index + 1; i <= this.playerOrder.length; i++) {
		if (i === this.playerOrder.length) {
			// for (var j = 0; j < playerOrder.length - 1 - index; j++) {
			// 	if (this.players[i].pile.length !== 0) {
			// 		this.currentPlayer = this.playerOrder[i];
			// 		break;
			// 	}
			// }
			i = 0;	
		}
		if (this.players[this.playerOrder[i]].pile.length !== 0) {
			this.currentPlayer = this.playerOrder[i];
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

	// if the game has already started, throw an error
	// otherwise, set the boolean to true
	if (this.isStarted) {
		throw 'error: game already started';
	}
	else {
		this.isStarted = true;
	}

	// throw an error if there are less than two players
	if (Object.keys(this.players).length < 2) {
		throw 'error: less than two players';
	}

	// populate pile with full deck of cards
	var suitArray = ['hearts', 'diamonds', 'clubs', 'spades'];
	for (var i = 1; i <= 13; i++) {
	  for (var j = 0; j < suitArray.length; j++) {
	      this.pile.push(new Card(suitArray[j], i));
	  }
	 }

	// shuffle the pile using built in function for Fisher-Yates
	this.pile = _.shuffle(this.pile);

	// distribute the cards evenly amongst the players
	// iterate through the pile, then iterate through each player
	// mod variable ensures that if there's less cards left than there are players, 
	// the players won't get any more cards
	var mod = this.pile.length % Object.keys(this.players).length;
	for (var i = this.pile.length - 1; i > 0; i--) {
		if (this.pile.length === mod) {
			break;
		}	
		for (var key in this.players) {
			this.players[key].pile.push(this.pile[i]);
			this.pile.pop();
			i--;
		}
	}

	this.currentPlayer = this.playerOrder[0];
};


// Check if the player with playerId is winning. In this case, that means he has the whole deck.
Game.prototype.isWinning = function(playerId) {
	
	// if the game hasn't started, throw an error
	if (!this.isStarted) {
			throw 'error: game already started';
		}

	// check if that player has a pile of 52 cards, meaning that they won
	if (this.players[playerId].pile.length === 52) {
		this.isStarted = false;
		return true;
	}
	return false;
};

// Play a card from the end of the pile
Game.prototype.playCard = function(playerId) {

	// if the game hasn't started, throw an error
	if (!this.isStarted) {
			throw 'error: game already started';
		}
	if (this.currentPlayer !== playerId) {
		throw 'error: player playing is out of turn';
	}
	if (this.players[playerId].pile.length === 0) {
		throw 'error: pile is empty';
	}

	var cardPlayed = this.players[playerId].pile[0];
	console.log(this.players[playerId].pile);
	this.pile.unshift(this.players[playerId].pile[0]);
	this.players[playerId].pile.shift();

	this.nextPlayer();

	return cardPlayed.toString();
};


// If there is valid slap, move all items of the pile into the players Pile,
// clear the pile
// remember invalid slap and you should lose 3 cards!!
Game.prototype.slap = function(playerId) {

	// throw an error if the game has been started
	if (!this.isStarted) {
		throw 'error: game not started';
	}

	// set boolean for determining if slap is valid
	var slapCondition = false;

	// if the top card is a jack, then a slap is valid
	if (this.pile[0].value === 11) {
		slapCondition = true;
	}

	// if the top card is equal to the card below it, then the slap is valid
	if (this.pile[0].value === this.pile[1].value) {
		slapCondition = true;
	}

	// if the top card is equal to the card two below it, then the slap is valid
	if (this.pile[0].value === this.pile[2].value) {
		slapCondition = true;
	}

	// if the slap is valid, add the pile to the player's pile
	// otherwise, remove 3 cards from the player's pile and place them in the center pile
	if (slapCondition) {
		this.players[playerId].pile.push(this.pile);
	}
	else {
		this.pile.push(this.players[playerId].pile.slice(0,3));
		this.players[playerId].pile.splice(0,3);
		return true; //{winning: false, message: 'lost 3 cards!'};
	}

	if (this.isWinning(playerId)) {
		return  false; //{winning: true, message: 'got the pile!'};
	}
	return true;
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
