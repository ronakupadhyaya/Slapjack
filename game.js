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
    this.playerOrder = []
    this.pile = [];
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw "Game has started"
    }
    if (username.trim() === '') {
      throw "Username is empty'"
    }
    for (var key in this.players) {
      if (this.players.hasOwnProperty(key) && this.players[key].username === username) {
        throw "Username has been used"
      }
    }
    var newPlayer = new Player(username)
    this.playerOrder.push(newPlayer.id)
    this.players[newPlayer.id] = newPlayer
    return newPlayer.id
  }


  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw "Game has started already"
    }
    if (Object.keys(this.players).length < 2) {
      throw "Game needs at least 2 players"
    }
    this.isStarted = true
    var suits = ['Spades', 'Clubs', 'Hearts', 'Diamonds']
    for (var i = 0; i < suits.length; i++) {
      for (var j = 1; j < 14; j++) {
        var newCard = new Card(suits[i], j)
        this.pile.push(newCard)
      }
    }
    this.pile = _.shuffle(this.pile)
    while (this.pile.length > 0) {
      for (var key in this.players) {
        if (this.pile.length === 0) {
          break;
        }
        if (this.players.hasOwnProperty(key)) {
          this.players[key].pile.push(this.pile.pop())
        }
      }
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw "The game has not started yet"
    }

    // while (this.players[this.playerOrder[0]].pile.length === 0) {
    //   console.log(this.playerOrder)
    this.playerOrder = this.playerOrder.concat(this.playerOrder.splice(0,1))
    // }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw "No winning player - game has not started"
    }
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true
    }
    return false;
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw "No play - game has not started"
    }
    if (this.playerOrder[0] !== playerId) {
      throw 'Its not this players turn'
    }
    if (this.players[playerId].pile.length === 0) {
      throw "This player has no cards to play"
    }
    var newCard = this.players[playerId].pile.pop()
    this.pile.push(newCard)
    var playersWithZero = 0
    var players = this.players
    this.playerOrder.forEach(function(item) {
      if (players[item].pile.length ===0) {
        playersWithZero ++
      }
    })
    if (playersWithZero.length === Object.keys(this.players).length) {
      this.isStarted = false;
      throw "No players with moves left"
    }
    this.nextPlayer()
    return  {
       card: newCard,
       cardString: newCard.toString()
     }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw "game has not started"
    }
    var last = this.pile.length - 1;
    if ((this.pile.length > 0 && this.pile[last].value === 11) ||
        (this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value) ||
        (this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value))
        {
          this.players[playerId].pile = this.pile.concat(this.players[playerId].pile)
          this.pile = []
          return {
            winning: this.isWinning(playerId),
            message: 'got the pile!'
          }
        }
    else {

      for (var i =0; i < Math.min(3, this.players[playerId].pile.length); i++) {
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
