var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted = false;
    this.players = {}
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    // YOUR CODE HERE
    var self = this;
    if (self.isStarted) {
      throw new Error("Game has started");
    }
    if (!username) {
      throw new Error("Username is empty");
    }
    var players = Object.keys(self.players);
    players.forEach(function(key) {
      if (self.players[key].username === username) {
        throw new Error("Username taken");
      }
    })
    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;
    return newPlayer.id;
  }

  startGame() {
    // YOUR CODE HERE
    var self = this;
    if (self.isStarted) {
      throw new Error("Game has started");
    }

    var players = Object.keys(self.players);
    if (players.length < 2) {
      throw new Error("Fewer than 2 people");
    }

    self.isStarted = true;
    //create pile and shuffle
    var suitArr = ["hearts", "diamonds", "spades", "clubs"];
    suitArr.forEach(function(suit) {
      for (var i = 1; i <= 13; i++) {
        self.pile.push(new Card(suit, i));
      }
    });
    self.pile = _.shuffle(self.pile);

    //distribute cards
    var dealCount = self.pile.length / players.length;
    players.forEach(function(key) {
      var player = self.players[key];
      player.pile = self.pile.splice(0, dealCount);
    });

    players.forEach(function(key) {
      var player = self.players[key];
      if (self.pile.length > 0) {
        player.pile.push(self.pile.splice(0, 1)[0]);
      }
    });
  }

  nextPlayer() {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error("Game has not started");
    }
    self.playerOrder.push(self.playerOrder.shift());
    var firstPlayer = self.players[self.playerOrder[0]];
    while (firstPlayer.pile.length === 0) {
      var lastPlayer = self.playerOrder.shift();
      self.playerOrder.push(lastPlayer);
      firstPlayer = self.players[self.playerOrder[0]];
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error("Game has not started");
    }

    var player = self.players[playerId];
    if (player.pile.length === 52) {
      self.isStarted = false;
      return true;
    } else {
      return false;
    }

  }

  playCard(playerId) {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error("Game has not started");
    }
    if (self.playerOrder[0] !== playerId) {
      throw new Error("Player out of turn");
    }
    var player = self.players[playerId];
    if (player.pile.length === 0) {
      throw new Error("No cards to play");
    }

    //move card from player hand to the top of the game pile
    var playedCard = player.pile.pop();
    self.pile.push(playedCard);

    //check if players have no cards
    var count = 0;
    var players = Object.keys(self.players);
    players.forEach(function(key) {
      if (self.players[key].pile.length === 0) {
        count++;
      }
    });

    if (count === players.length) {
      self.isStarted = false;
      throw new Error("Tie!");
    }

    self.nextPlayer();
    return {
      card: playedCard,
      cardString: playedCard.toString()
    };
  }

  slap(playerId) {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error("Game has not started");
    }
    var player = self.players[playerId];
    //winning conditions
    //top card is a Jack, top two cards of same value, or sandwich
    var condition1 = self.pile.length > 0 && self.pile[self.pile.length - 1].value === 11;
    var condition2 = self.pile.length > 1 && (self.pile[self.pile.length - 1].value === self.pile[self.pile.length - 2].value);
    var condition3 = self.pile.length > 2 && (self.pile[self.pile.length - 1].value === self.pile[self.pile.length - 3].value);
    if (condition1 || condition2 || condition3) {
      player.pile = [...self.pile, ...player.pile];
      self.pile = [];
      return {
        winning: self.isWinning(playerId),
        message: "got the pile!"
      }
    } else {
      //not a winning condition, take cards from player
      //self.pile = [...player.pile.splice(0, Math.min(3, player.pile.length)), ...self.pile];
      var len = Math.min(3, player.pile.length);
      self.pile = player.pile.splice(player.pile.length - len, len).concat(self.pile);
      return {
        winning: false,
        message: 'lost ' + len + ' cards!'
      }
    }
  }

  // PERSISTENCE FUNCTIONS
  //
  // Start here after completing Step 2!
  // We have written a persist() function for you to save your game state to
  // a store.json file.
  // =====================
  fromObject(object) {
    this.isStarted = object.isStarted;

    this.players = _.mapObject(object.players, player => {
      var p = new Player();
      p.fromObject(player);
      return p;
    });

    this.playerOrder = object.playerOrder;

    this.pile = object.pile.map(card => {
      var c = new Card();
      c.fromObject(card);
      return c;
    });
  }

  toObject() {
    return {
      isStarted: this.isStarted,
      players: _.mapObject(this.players, val => val.toObject()),
      playerOrder: this.playerOrder,
      pile: this.pile.map(card => card.toObject())
    };
  }

  fromJSON(jsonString) {
    this.fromObject(JSON.parse(jsonString));
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  persist() {
    if (readGame && persist.hasExisting()) {
      this.fromJSON(persist.read());
      readGame = true;
    } else {
      persist.write(this.toJSON());
    }
  }
}

module.exports = Game;
