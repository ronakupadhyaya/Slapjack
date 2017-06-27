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
    // YOUR CODE HERE
    if (!username) {
      throw new Error("empty username");
    } else if (this.isStarted) {
      throw new Error("can't add player when game has already started");
    }
    for (var player in this.players) {
      if (this.players[player].username === username) {
        throw new Error("username exists");
      }
    }
    var newPlayer = new Player(username);
    this.players[newPlayer.id] = newPlayer;
    this.playerOrder.push(newPlayer.id);
    return newPlayer.id;
  }

  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw new Error("game has already started!");
    } else if (Object.keys(this.players).length < 2) {
      throw Error("at least two players must be added");
    } else {
      this.isStarted = true;
      var suits = ["Hearts", "Diamonds", "Spades", "Clubs"];
      for (var i = 1; i < 14; i++) {
        for (var j = 0; j < suits.length; j++) {
          this.pile.push(new Card(suits[j], i));
        }
      }
      this.pile = _.shuffle(this.pile);
      while(this.pile.length > 0) {
        for(var player in this.players) {
          if (this.pile.length > 0) {
            this.players[player].pile.push(this.pile.pop());
          }
        }
      }
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("game has not started!");
    } else {
      var firstPlayer = this.playerOrder.shift();
      this.playerOrder.push(firstPlayer);
      while(this.players[this.playerOrder[0]].pile.length === 0) {
        var firstPlayer = this.playerOrder.shift();
        this.playerOrder.push(firstPlayer);
      }
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("game has not started!");
    } else {
      if (this.players[playerId].pile.length === 52) {
        this.isStarted = false;
        return true;
      }
      return false;
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("game has not started!");
    } else if (this.playerOrder[0] !== playerId) {
      throw new Error("its not your turn!");
    } else if (this.players[playerId].pile.length === 0){
      throw new Error("your pile is empty!");
    } else {
      var topCard = this.players[playerId].pile.pop();
      this.pile.push(topCard);
      var everyoneAtZero = true;
      for (var player in this.players) {
        if (this.players[player].pile.length !== 0) {
          everyoneAtZero = false;
        }
      }
      if (everyoneAtZero) {
        throw new Error("its a tie!");
      }
      this.nextPlayer();
      return {
        card: topCard,
        cardString: topCard.toString()
      };
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("game has not started!");
    } else {
      var topCard = this.pile[this.pile.length - 1];
      var last = this.pile.length - 1;
      var winningSlap = false;
      if (topCard.value === 11) {
        winningSlap = true;
      } else if (this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value) {
        winningSlap = true;
      } else if (this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value) {
        winningSlap = true;
      }
      if (winningSlap) {
        this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
        this.pile = [];
        return {
          winning: this.isWinning(playerId),
          message: 'got the pile!'
        }
      } else {
        for (var i = 0; i < Math.min(3, this.players[playerId].pile.length); i++) {
          var currCard = this.players[playerId].pile.pop();
          this.pile.unshift(currCard);
        }
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
