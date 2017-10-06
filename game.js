var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted = false
    this.players = {}
    this.playerOrder = []
    this.pile = []
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted) throw "Game has already started"
    if (!username.trim()) throw "Username must not be empty"
    for (var id in this.players)
      if (this.players[id].username === username)
        throw "Username must be unique"
    var player = new Player(username);
    this.playerOrder.push(player.id)
    this.players[player.id] = player
    return player.id
  }

  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) throw "Game has already started"
    if (Object.keys(this.players).length < 2) throw "Need at least 1 player to player"
    this.isStarted = true

    const suits = ["Clubs", "Diamonds", "Spades", "Hearts"]
    const nums = _.range(1, 14)
    let deck = [];
    suits.forEach((s) => {
      nums.forEach((n) => {
        deck.push(new Card(s, n))
      });
    })
    this.pile = deck
    this.pile = _.shuffle(this.pile)

    while (Object.keys(this.pile).length)
      for (var id in this.players)
        if (this.pile[0])
          this.players[id].pile.push(this.pile.pop())
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted) throw "Game has not yet started"
    let shft = this.playerOrder.shift()
    this.playerOrder.push(shft)
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) throw "Game has not yet started"
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false
      return true
    }
    return false
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) throw "Game has not yet started"
    if (this.playerOrder[0] !== playerId) throw "Not your turn"
    if (!this.players[playerId].pile.length) throw "Your pile is empty - move not allowed"

    const newCard = this.players[playerId].pile.pop()
    this.pile.push(newCard)
    let counter = 0;
    for (var id in this.players)
      if (this.players[id].pile.length === 0) counter++
    if (counter === Object.keys(this.players).length) {
      this.isStarted = false
      throw "It's a tie!"
    }
    this.nextPlayer()
    return {
      card: newCard,
      cardString: newCard.toString()
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) throw "Game has not yet started"

    const last = this.pile.length - 1
    let playerPile = this.players[playerId].pile
    console.log('\n\n', this.pile[last], this.pile[last].value === 11)
    if (this.pile[last].value === 11 ||
        this.pile[last].value === this.pile[last-1].value ||
        this.pile.length > 2 && this.pile[last].value === this.pile[last-2].value) {
      this.players[playerId].pile = [...this.pile, this.players[playerId].pile]
      this.pile = []
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    }
    else {
      const topCards = playerPile.slice(-3)
      for (var i = 0; i < topCards.length; i++) {
        this.pile.unshift(playerPile.pop())
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
