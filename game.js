var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted = false;
    this.players = {};
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw new Error('Cannot add new player: Game has already started!');
    } else if (username.trim() === '') {
      throw new Error('Cannot add new player: Username is empty');
    } else {
      for (var id in this.players) {
        if (this.players[id].username === username) {
          throw new Error('Cannot add new player: User already exists');
        } 
      }
      var newPlayer = new Player(username);
      this.players[newPlayer.id] = newPlayer;
      this.playerOrder.push(newPlayer.id);
      return newPlayer.id;
    }
  }

  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw new Error('Cannot start game: Game has already started!');
    } else if (this.playerOrder.length < 2) {
      throw new Error('Cannot start game: Game has less than 2 players');
    } else {
      this.isStarted = true;
      var suits = ['Hearts', 'Clubs', 'Spades', 'Diamonds']
      var cards = [];
      for (var i = 0; i < suits.length; i++) {
        for (var j = 1; j < 14; j++) {
          cards.push(new Card(suits[i], j));
        }
      }
      cards = _.shuffle(cards);
      var k = 0;
      var l = 0;
      while (k < 52) {
        this.players[this.playerOrder[l]].pile.push(cards[k]);
        l++;
        if (l === this.playerOrder.length) {
          l = 0;
        }
        k++;
      }
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Cannot get next player: Game has not started!');
    } else {
      do {
        var player = this.playerOrder.shift();
        this.playerOrder.push(player);
      }
      while (this.players[this.playerOrder[0]].pile.length < 1)
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Cannot get is winning: Game has not started!');
    } else {
      if (this.players[playerId].pile.length === 52) {
        this.isStarted = false;
      }
      return !(this.isStarted);
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Cannot play card: Game has not started!');
    } else if (this.playerOrder[0] !== playerId) {
      throw new Error("Cannot play card: It is not the player's turn");
    } else if (this.players[playerId].pile.length === 0){
      throw new Error("Cannot play card: Player has no cards");
    } else {
      this.pile.push(this.players[playerId].pile.pop());
      var count = 0;
      for (var i = 0; i < this.playerOrder.length; i++) {
        if (this.players[this.playerOrder[i]].pile.length === 0) {
          count++;
        }
      }
      if (count === this.playerOrder.length) {
        this.isStarted = false;
        throw new Error("Cannot play card: It's a Tie!");
      }
      this.nextPlayer();
      var card = this.pile[this.pile.length - 1];
      return {
        card: card,
        cardString: card.toString()
      }
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Cannot slap: Game has not started!');
    } else {
      var last = this.pile.length - 1;
      if (this.pile[last].value === 11 ||
          this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value ||
          this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value) {
        this.players[playerId].pile = this.pile.concat(this.players[playerId].pile);
        this.pile = [];
        return {
          winning: this.isWinning(playerId),
          message: 'got the pile!'
        }
      } else {
        var numCardsToTake = Math.min(3, this.players[playerId].pile.length);
        this.pile = this.players[playerId].pile.splice(this.players[playerId].pile.length - 1 - numCardsToTake, numCardsToTake).concat(this.pile);
        return {
          winning: false,
          message: 'lost 3 cards!'
        }
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
