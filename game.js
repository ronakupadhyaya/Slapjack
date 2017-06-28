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
      throw new Error('Error: Game in progress');
    } else if (!username) {
      throw new Error('Error: Empty username given');
    } else if (_.values(this.players).reduce((a, b) => (username === b.username || a), false)) { //Check through each player object for the matching username
      throw new Error('Error: Username in use');
    } else {
      var player = new Player(username);
      this.players[player.id] = player;
      this.playerOrder.push(player.id);
      return player.id;
    }
  }

  startGame() {
    if (this.isStarted) {
      throw new Error('Error: Game in progress');
    } else if (this.playerOrder.length < 2) {
      throw new Error('Error: Too few players in game');
    } else {
      this.isStarted = true;
      var suitArr = ['spades', 'clubs', 'diamonds', 'hearts'];
      for (var val = 1; val <= 13; val++) {
        suitArr.forEach((suit) => {
          this.pile.push(new Card(suit, val));
        })
      }
      this.pile = _.shuffle(this.pile);
      var idx = 0;
      while (this.pile.length > 0) {
        this.players[this.playerOrder[idx]].pile.push(this.pile.pop());
        idx++;
        if (idx >= this.playerOrder.length) {
          idx = 0;
        }
      }
    }
  }

  nextPlayer() {
    if (!this.isStarted) {
      throw new Error('Error: Game has not started');
    } else {
      this.playerOrder.push(this.playerOrder.shift());
      while (this.players[this.playerOrder[0]].pile.length === 0) {
        this.playerOrder.push(this.playerOrder.shift());
      }
    }
  }

  isWinning(playerId) {
    if (!this.isStarted) {
      throw new Error('Error: Game has not started');
    } else if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    } else {
      return false;
    }
  }

  playCard(playerId) {
    if (!this.isStarted) {
      throw new Error('Error: Game has not started');
    } else if (this.playerOrder[0] !== playerId) {
      throw new Error('Error: It is not your turn');
    } else if (this.players[playerId].pile.length === 0) {
      throw new Error('Error: Your pile is empty');
    } else {
      var newCard = this.players[playerId].pile.pop();
      this.pile.push(newCard);
      if (_.values(this.players).reduce((a, b) => (b.pile.length === 0 && a), true)) { // Check each players deck, if one of them has a card then the game is still on
        this.isStarted = false;
        throw new Error("It's a tie!");
      }
      this.nextPlayer();
      return { card: newCard, cardString: newCard.toString() };
    }
  }

  slap(playerId) {
    if (!this.isStarted) {
      throw new Error('Error: Game has not started');
    } else {
      var last = this.pile.length - 1;
      if (this.pile[last].value === 11 || // Check for any win conditions
        (this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value) ||
        (this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value)) {
        this.players[playerId].pile = this.pile.splice(0).concat(this.players[playerId].pile); // Empty game pile into back of player pile
        return { winning: this.isWinning(playerId), message: 'got the pile!' }
      } else {
        this.pile = this.players[playerId].pile.splice(-3).concat(this.pile); // Remove last 3 cards in player deck and add them to back of game pile
        return { winning: false, message: 'lost 3 cards!' };
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
