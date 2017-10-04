var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;
var _ = require('underscore');

class Game {
  constructor() {
    this.isStarted = false;
    this.players = {};
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    if (this.isStarted) {
      throw "Game has already started.";
    }
    if (!username) {
      throw "Invalid username."
    }
    if (this.usernameTaken(username)) {
      throw "Username already taken."
    }
    var player = new Player(username);
    this.playerOrder.push(player.id);
    this.players[player.id] = player;
    return player.id;
  }

  usernameTaken(username) {
    for (var id in this.players) {
      if (this.players[id].username === username) {
        return true;
      }
    }
    return false;
  }

  startGame() {
    if (this.isStarted) {
      throw "Game has already started.";
    }
    if (this.playerOrder.length < 2) {
      throw "Not enough people to play yet.";
    }
    this.isStarted = true;
    var suits = ['hearts', 'spades', 'clubs', 'diamonds'];
    for (var i = 1; i < 14; i++) {
      for (var j in suits) {
        this.pile.push(new Card(suits[j], i));
      }
    }
    this.pile = _.shuffle(this.pile);
    var i = 0;
    while (this.pile[0]) {
      this.getPlayer(i).pile.push(this.pile.pop());
      i++;
      if (i === this.playerOrder.length) {
        i = 0;
      }
    }
  }

  nextPlayer() {
    if (!this.isStarted) {
      throw "Game has already started.";
    }
    do {
      this.playerOrder.push(this.playerOrder.shift());
    } while (!this.getPlayer(0).pile[0]);
  }

  getPlayer(num) {
    return this.players[this.playerOrder[num]];
  }

  isWinning(playerId) {
    if (!this.isStarted) {
      throw "Game has already started.";
    }
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    if (!this.isStarted) {
      throw "Game has already started.";
    }
    if (playerId !== this.playerOrder[0]) {
      throw "Player attempted to play out of turn";
    }
    if (this.players[playerId].pile.length === 0) {
      throw "Player has no cards";
    }
    var card = this.players[playerId].pile.pop()
    this.pile.push(card);
    this.nextPlayer();
    return {
      card: card,
      cardString: card.toString()
    };
  }

  slap(playerId) {
    if (!this.isStarted) {
      throw "Game has already started.";
    }
    var last = this.pile.length - 1;
    if ((this.pile[last] && this.pile[last].value === 11) || (this.pile[last - 1] && this.pile[last].value === this.pile[last - 1].value) || (this.pile[last - 2] && this.pile[last].value === this.pile[last - 2].value)) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    } else {
      for (var i = 0; i < Math.min(3, this.players[playerId].pile.length); i++) {
        this.pile.unshift(this.players[playerId].pile.pop())
      }
      return {
        winning: false,
        message: 'lost 3 cards!'
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
