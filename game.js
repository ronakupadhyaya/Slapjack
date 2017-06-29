var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    this.isStarted = false;
    this.players = {};
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    if (this.isStarted) {
      throw new Error("The game has already started");
    };
    if (username.trim().length < 1) {
      throw new Error("Username is empty");
    };
    _.forEach((this.players), (player) => {
      if (player.username === username) {
        throw new Error("There are duplicate usernames")
      };
    });
    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;
    return newPlayer.id;
  }

  startGame() {
    if (this.isStarted) {
      throw new Error("The game has already started");
    };
    if (this.playerOrder.length < 2) {
      throw new Error("There are not enough players");
    };
    this.isStarted = true;
    var cards = [];
    var suits = ['hearts', 'diamonds', 'spades', 'clubs'];
    _.forEach((suits), (suit) => {
      for (var i = 1; i < 14; i++) {
        var newCard = new Card(suit, i);
        cards.push(newCard);
      };
    });
    var shuffled = _.shuffle(cards);

    while (shuffled.length != 0) {
      for (var i = 0; i < this.playerOrder.length; i++) {
        var id = this.playerOrder[i];
        if (shuffled.length === 0) {
          break;
        }
        this.players[id].pile.push(shuffled.pop());
      }
    };
  }

  nextPlayer() {
    if (!this.isStarted) {
      throw new Error("The game has not started yet");
    };

    var id = this.playerOrder.shift();
    while (this.players[id].pile.length < 1) {
      this.playerOrder.push(id);
      id = this.playerOrder.shift();
    }
    this.playerOrder.push(id);
  }

  isWinning(playerId) {
    if (!this.isStarted) {
      throw new Error("The game has not started yet");
    };
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    if (!this.isStarted) {
      throw new Error("The game has not started yet");
    };
    if (playerId !== this.playerOrder[0]) {
      throw new Error("The current playerID doesn't match the passed in ID")
    };
    if (this.players[playerId].pile.length === 0) {
      throw new Error("The corresponding player has a pile length of 0")
    };
    //move top card of player's pile to top of game pile
    var card = this.players[playerId].pile.pop();
    this.pile.push(card);

    //count number of players with 0 cards
    var count = 0;
    _.forEach((this.playerOrder), (id) => {
      if (this.players[id].pile.length === 0) {
        count++;
      };
    });
    if (count === this.playerOrder.length) {
      throw new Error("Tie - all players have 0 cards")
    };

    this.nextPlayer();
    return {
      card: card,
      cardString: card.toString()
    };
  }

  slap(playerId) {
    if (!this.isStarted) {
      throw new Error("The game has not started yet");
    };

    //check for any of the winning slap conditions
    var last = this.pile.length - 1;
    if ((this.pile.length > 0 && this.pile[last].value === 11) || (this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value) || (this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value)) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      };
    };

    var numCards = Math.min(3, this.players[playerId].pile.length);
    //console.log(numCards);
    //console.log(this.pile.length);
    for (var i = 0; i < numCards; i++) {
      var card = this.players[playerId].pile.pop();
      this.pile = [card, ...this.pile];
    };
    return {
      winning: false,
      message: 'lost ' + numCards + ' cards!'
    };
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
