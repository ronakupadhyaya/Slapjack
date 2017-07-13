var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;
var values = require('object.values')

class Game {
  constructor() {
    this.isStarted = false;
    this.players = {};
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    if (this.isStarted)
      throw new Error('Game has already started');
    if (username.trim() === '')
      throw new Error('Username must be defined');

    var players = values(this.players);
    players.forEach(function(person) {
      if (person.username === username)
        throw new Error('Username must be unique');
    })

    var player = new Player(username);
    this.playerOrder.push(player.id);
    this.players[player.id] = player;
    return player.id;
  }

  startGame() {
    if (this.isStarted)
      throw new Error('Game has already started');
    if (this.playerOrder.length < 2)
      throw new Error('Game does not have enough players');

    this.isStarted = true;
    for (var k = 1; k <= 13; k++) {
      for (var i = 0; i < 4; i++) {
        var suit;
        switch (i) {
          case 0:
            suit = 'hearts';
            break;
          case 1:
            suit = 'diamonds';
            break;
          case 2:
            suit = 'clubs';
            break;
          case 3:
            suit = 'spades';
            break;
        }
        this.pile.push(new Card(suit, k))
      }
    }
    this.pile = _.shuffle(this.pile);

    var cloned = this.pile.slice();

    var keys = Object.keys(this.players);

    this.pile.forEach(function() {
      var index = cloned.length % keys.length;
      var card = cloned.pop();
      this.players[keys[index]].pile.push(card);
    }.bind(this))

    this.pile = [];
  }

  nextPlayer() {
    if (!this.isStarted)
      throw new Error('Game has not yet started');

    var person = this.playerOrder.shift()
    this.playerOrder.push(person)
    var currentPlayerId = this.playerOrder[0];
    var currentPlayer = this.players[currentPlayerId];

    while (currentPlayer.pile.length === 0) {
      var person = this.playerOrder.shift()
      this.playerOrder.push(person)
      currentPlayerId = this.playerOrder[0];
      currentPlayer = this.players[currentPlayerId];
    }
  }

  isWinning(playerId) {
    if (!this.isStarted)
      throw new Error('Game has not yet started');

    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    if (!this.isStarted)
      throw new Error('Game has not yet started');
    if (this.playerOrder[0] !== playerId)
      throw new Error('It is not your turn');
    if (this.players[playerId].pile.length === 0)
      throw new Error('You have no more cards to play');

    var cardPlayed = this.players[playerId].pile.pop();
    this.pile.push(cardPlayed);

    var playerCntZero = 0;

    for (var player in this.players) {
      if (this.players[player].pile.length === 0)
        playerCntZero++;
    }

    if (playerCntZero === this.playerOrder.length) {
      this.isStarted = false;
      throw new Error('It\'s a tie');
    }

    this.nextPlayer();
    return {
      card: cardPlayed,
      cardString: cardPlayed.toString()
    };
  }

  slap(playerId) {
    if (!this.isStarted)
      throw new Error('Game has not yet started');
    if ((this.pile.length > 0 && this.pile[this.pile.length - 1].value === 11) ||
      (this.pile.length > 1 && this.pile[this.pile.length - 1].value === this.pile[this.pile.length - 2].value) ||
      (this.pile.length > 2 && this.pile[this.pile.length - 1].value === this.pile[this.pile.length - 3].value)) {
      this.players[playerId].pile = this.pile.concat(this.players[playerId].pile)
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    } else {
      var removeCnt = Math.min(3, this.players[playerId].pile.length);
      var removed = this.players[playerId].pile.splice(this.players[playerId].pile.length - removeCnt, removeCnt);
      this.pile = removed.concat(this.pile);
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