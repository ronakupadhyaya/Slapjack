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
    var playerExist = false;

    for (var i = 0; i < this.playerOrder.length; i++) {
      if (username === this.players[this.playerOrder[i]].username) {
        playerExist = true;
      }
    }

    if (this.isStarted) {
      throw new Error('The game has already started!')
    }
    else if (username.trim() === '') {
      throw new Error('Every player must have a username to play!')
    }
    else if (playerExist === true) {
      throw new Error('Every player must have a unique username!')
    }
    else {
      var newPlayer = new Player(username);
      this.playerOrder.push(newPlayer.id)
      this.players[newPlayer.id] = newPlayer;
      return newPlayer.id;
    }
  }

  startGame() {
    if (this.isStarted) {
      throw new Error('The game has already started!')
    }
    else if (this.playerOrder.length < 2) {
      throw new Error('You need at least two players to begin!')
    }
    else {
      this.isStarted = true;
      var suits = ["hearts", "clubs", "diamonds", "spades"];

      for (var n = 0; n < suits.length; n++) {
        for (var i = 1; i <= 13; i++) {
          this.pile.push(new Card(suits[n], i))
        };
      };
      this.pile = _.shuffle(this.pile)
      var i = 0;
      while(this.pile.length > 0) {
        this.players[this.playerOrder[i]].pile.push(this.pile.pop())
        i = (i + 1) % this.playerOrder.length
      }
    }
  }

  nextPlayer() {
    if (!this.isStarted) {
      throw new Error('The game has not started yet!')
    }
    else {
      var num = this.playerOrder.shift()
      this.playerOrder.push(num)
      while (this.playerOrder[1].pile === []) {
        num = this.playerOrder.shift()
        this.playerOrder.push(num)
      }
    }
  }

  isWinning(playerId) {
    if (!this.isStarted) {
      throw new Error('The game has not started yet!')
    }
    else if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }
    else {
      return false;
    }
  }

  playCard(playerId) {
    if (!this.isStarted) {
      throw new Error('The game has not started yet!')
    }
    else if (this.playerOrder[0] !== playerId) {
      throw new Error('Please wait your turn to play a card!')
    }
    else if (this.players[playerId].pile.length === 0) {
      throw new Error('You have no more cards to play!')
    }
    else {
      var newCard = this.pile.push(this.players[playerId].pile.pop());
      this.nextPlayer();
      return {card: newCard, cardString: newCard.toString()}
    }
  }

  slap(playerId) {
    var last = this.pile.length - 1;
    if (!this.isStarted) {
      throw new Error('The game has not started yet!')
    }
    else if ((this.pile[last].value === 11) || (this.pile.length >= 2 && this.pile[last].value === this.pile[last - 1].value)
        || (this.pile.length >= 3 && this.pile[last].value === this.pile[last - 2].value)) {
      this.players[playerId].pile.unshift(...this.pile);
      this.pile = [];
      return {winning: this.isWinning(playerId), message: 'got the pile!'}
    } else {
      for (var i = 0; i < Math.min(3, this.players[playerId].pile.length); i++) {
        this.pile.unshift(this.players[playerId].pile.pop());
      };
      return {winning: false, message: 'lost 3 cards!'}
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
