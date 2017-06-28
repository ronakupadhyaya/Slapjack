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
      throw Error;
    } else if (username.trim().length === 0) {
      throw Error;
    } else {
      _.forEach(this.players, function(elem) {
        if (elem.username === username) {
          throw Error;
        }
      })
      var newPlayer = new Player(username);
      this.playerOrder.push(newPlayer.id);
      this.players[newPlayer.id] = newPlayer;
      return newPlayer.id
    }
  }

  startGame() {
    if (this.isStarted) {
      throw Error;
    } else if (_.size(this.players) < 2) {
      throw Error;
    } else {
      this.isStarted = true;
      var suits = ['spades', 'hearts', 'diamonds', 'clubs'];
      for (var val = 1; val <= 13; val++) {
        suits.forEach((elem) => {
          this.pile.push(new Card(elem, val));
        })
      }
      this.pile = _.shuffle(this.pile);
      for (var cardIdx = 0; cardIdx < this.pile.length; cardIdx++) {
        this.players[this.playerOrder[cardIdx % this.playerOrder.length]].pile
          .push(this.pile[cardIdx]);
      }
      this.pile = [];
    }
  }

  nextPlayer() {
    if (!this.isStarted) {
      throw Error;
    } else {
      var shifted = this.playerOrder.shift();
      this.playerOrder.push(shifted);
      while (this.players[this.playerOrder[0]].pile.length === 0) {
        var newShift = this.playerOrder.shift();
        this.playerOrder.push(newShift);
      }
    }
  }

  isWinning(playerId) {
    if (!this.isStarted) {
      throw Error;
    } else {
      if (this.players[playerId].pile.length === 52) {
        this.isStarted = false;
        return true;
      } else {
        return false;
      }
    }
  }

  playCard(playerId) {
    if (!this.isStarted) {
      throw Error;
    } else if (this.playerOrder[0] !== playerId) {
      throw Error;
    } else if (this.players[playerId].pile.length === 0) {
      throw Error;
    } else {
        var top = this.players[playerId].pile.pop();
        this.pile.push(top);
        var numberOfZero = 0;
        _.forEach(this.players, (elem) => {
          if (elem.pile.length === 0) {
            numberOfZero++;
          }
        });
        if (numberOfZero === this.playerOrder.length) {
          this.isStarted = false;
          throw Error;
        }
        this.nextPlayer();
        return {
          card: top,
          cardString: top.toString()
        }
    }
  }

  slap(playerId) {
    if (!this.isStarted) {
      throw Error;
    } else {
      var last = this.pile.length - 1;
      var lastVal = this.pile[last].value;
      if (this.pile.length > 2 && (lastVal === this.pile[last - 2].value || lastVal === this.pile[last - 1].value || lastVal === 11 )) {
        this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
        this.pile = [];
        return {
          winning: this.isWinning(playerId),
          message: 'got the pile!'
        }
      } else {
        var playerPile = this.players[playerId].pile;
        var numCards = Math.min(3, playerPile.length);
        var cards = playerPile.splice(playerPile.length - numCards);
        this.pile = [...cards, ...this.pile];
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
