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
    var unique = true;
    var self = this;
    Object.keys(this.players).forEach(function(player) {
      if (self.players[player].username === username) {
        unique = false;
      }
    })
    if (this.isStarted) {
      throw 'Too late to join! haha u suk'
    } else if (!username.trim().length) {
      throw 'Empty username'
    } else if (!unique) {
      throw 'Username already exists'
    } else {
      var player = new Player(username);
      this.playerOrder.push(player.id);
      this.players[player.id] = player;
      return player.id;
    }
  }

  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw 'Game has already started yo'
    } else if (this.playerOrder.length < 2) {
      throw 'Not enough players rip.'
    } else {
      this.isStarted = true;
      var cards = [];
      var suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
      suits.forEach(function(suit) {
        for (var i = 1; i <= 13; i++) {
          var card = new Card(suit, i);
          cards.push(card);
        }
      })
      cards = _.shuffle(cards);
      var self = this;
      cards.forEach(function(card) {
        var playerIndex = cards.indexOf(card)%self.playerOrder.length;
        var playerDealt = self.players[self.playerOrder[playerIndex]];
        playerDealt.pile.push(card);
      })
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw 'Game has not started yet.'
    } else {
      do {
        this.playerOrder.push(this.playerOrder.shift());
      } while (!this.players[this.playerOrder[0]].pile.length)
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw 'Game has not started yet'
    } else {
      var playerPileLength = this.players[playerId].pile.length;
      if (playerPileLength === 52) {
        this.isStarted = false;
        return true;
      }
      return false;
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw 'Game has not started yet'
    } else if (this.playerOrder[0] !== playerId) {
      throw 'Woah there dude not your turn'
    } else if (this.players[playerId].pile.length === 0) {
      throw 'You\'re outta cards man.'
    } else {
      var card = this.players[playerId].pile.pop();
      this.pile.push(card);
      if (this.pile.length === 52) {
        throw 'I\'ts a tie!!!'
      } else {
        this.nextPlayer();
        return {
          card: card,
          cardString: card.toString()
        }
      }
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    //var self = this;
    function success() {
      var playerPile = this.players[playerId].pile;
      var gamePile = this.pile;
      //console.log('\nOne of the player\'s piles is:\n', this.players[playerId].pile);
      //console.log('\nThe game pile is:\n'+this.pile);
      this.players[playerId].pile = gamePile.concat(playerPile);
      //console.log('\nOne of the player\'s piles is:\n', this.players[playerId].pile);
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      };
    }
    success = success.bind(this);

    if (!this.isStarted) {
      throw 'Game has not started yet'
    } else if (this.pile[this.pile.length-1].value === 11) {
      return success();
    } else if (this.pile[this.pile.length-2].value && (this.pile[this.pile.length-1].value === this.pile[this.pile.length-2].value)) {
      return success();
    } else if (this.pile[this.pile.length-3] && (this.pile[this.pile.length-1].value === this.pile[this.pile.length-3].value)) {
      return success();
    } else {
      var burnNumber = Math.min(3, this.players[playerId].pile.length);
      var burnPile = this.players[playerId].pile.splice(this.players[playerId].pile.length-burnNumber, burnNumber);
      this.pile = burnPile.concat(this.pile);
      return {
        winning: false,
        message: `lost ${burnNumber} cards!`
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
