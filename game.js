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
      throw new Error('Game has already started!');
    }
    if (!username || username.trim().length === 0) {
      throw new Error('Username is empty!');
    }
    if (_.values(this.players).map((k) => k.username).indexOf(username) > -1) {
      throw new Error('Username is taken!');
    }
    var player = new Player(username);
    this.playerOrder.push(player.id);
    this.players[player.id] = player;
    return player.id;
  }

  startGame() {
    if (this.isStarted) {
      throw new Error('Game has already started!');
    }
    if (Object.keys(this.players).length < 2) {
      throw new Error('Insufficient players!');
    }
    this.isStarted = true;

    // Create the Deck
    this.pile = ['hearts', 'spades', 'clubs', 'diamonds'].reduce((cache, val) => {
      return [...cache, ...[...Array(13).keys()].map(i => new Card(val, i + 1))]
    }, []);

    // Shuffle the Deck
    this.pile = _.shuffle(this.pile);

    // Distribute from pile
    // If the number of players does not divide 52 evenly, then the number of cards
    // will not be divided evenly.
    while (this.pile.length > 0) {
      for (const player of _.values(this.players)) {
        if (this.pile.length > 0) {
          player.pile.push(this.pile.pop());
        }
      }
    }
  }

  // Use this.playerOrder and this.currentPlayer to figure out whose turn it is next!
  nextPlayer() {
    if (!this.isStarted) {
      throw new Error('Game has not started yet!');
    }
    this.playerOrder.push(this.playerOrder.shift());
    while (this.players[this.playerOrder[0]].pile.length === 0) {
      this.playerOrder.push(this.playerOrder.shift());
    }
  }

  // Check if the player with playerId is winning. In this case, that means he has the whole deck.
  isWinning(playerId) {
    if (!this.isStarted) {
      throw new Error('Game has not started yet!');
    }
    if (this.players[playerId].pile.length !== 52) {
      return false;
    }
    this.isStarted = false;
    return true;
  }

  // Play a card from the end of the pile
  // The first card in the pile represents the bottom of the pile
  playCard(playerId) {
    if (!this.isStarted) {
      throw new Error('Game has not started yet!');
    }
    if (this.playerOrder[0] !== playerId) {
      throw new Error(`Not ${this.players[playerId].username}'s turn yet`);
    }
    if (this.players[this.playerOrder[0]].pile.length === 0) {
      throw new Error(`${this.players[playerId].username} has no cards!`);
    }
    var newCard = this.players[this.playerOrder[0]].pile.pop();
    this.pile.push(newCard);
    this.nextPlayer();

    return {
      card: newCard,
      cardString: newCard.toString()
    };
  }

  // If there is valid slap, move all items of the pile into the players Pile,
  // clear the pile
  // remember invalid slap and you should lose 3 cards, 3 cards go to bottom of pile
  slap(playerId) {
    if (!this.isStarted) {
      throw new Error('Game has not started yet!');
    }
    var last = this.pile.length - 1;
    if ((this.pile.length > 0 && this.pile[last].value === 11) ||
        (this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value) ||
        (this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value)) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    } else {
      var playerPile = this.players[playerId].pile;
      this.pile = [playerPile.pop(),
                   playerPile.pop(),
                   playerPile.pop(),
                   ...this.pile];
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
