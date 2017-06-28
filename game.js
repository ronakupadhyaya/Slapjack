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
    this.pile = [] //array of the central pile.
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw new Error('Whoops! The game has started!')
    }
    if (username.trim() === '') {
      throw new Error('Whoops! Username is empty')
    }

    for (var key in this.players) {
      if (this.players[key].username === username) {
        throw new Error('Whoops! Username is not unique')
      }
    }

    // create user
    var newPlayer = new Player(username)
    //push id to this.playerOrder
    this.playerOrder.push(newPlayer.id)
    // add new player to players object
    this.players[newPlayer.id] = newPlayer
    // return id of new Player
    return newPlayer.id
  }

  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw new Error('Whoops! The game has started!')
    }

    var allPlayers = Object.keys(this.players).map(key => this.players[key])

    if (allPlayers.length < 2) {
      throw new Error('Whoops! Fewer than two players!')
    }
    this.isStarted = true;
    //create a standard deck of 52 playing cards (4 suits x 13 values) and shuffle them
    this.deck = []
    var ranks = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
    var suits = ["Clubs", "Diamonds", "Hears", "Spades"];

    for (var i = 0; i < suits.length; i++) {
      for (var j = 0; j < ranks.length; j++) {
        this.deck.push(new Card(suits[i], ranks[j]))
      }
    }
    this.deck = _.shuffle(this.deck)

    //distribute the cards evenly to all players

    var res = _.groupBy(this.deck, function(item, index) {
      return  index % allPlayers.length
    })
    allPlayers.forEach(function(p, index) {
      p.pile = res[index]
    })
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Whoops! The game has not started!')
    }

  if (this.playerOrder.length != 0) {
    var tempPlayer = this.playerOrder[0]
    this.playerOrder.splice(0, 1)
    this.playerOrder.push(tempPlayer)

    while (this.players[this.playerOrder[0]].pile.length === 0) {
      var tempPlayer = this.playerOrder[0]
      this.playerOrder.splice(0, 1)
      this.playerOrder.push(tempPlayer)
      }
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Whoops! The game has not started!')
    }
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false
      return true
    }
    return false;

  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Whoops! The game has not started!')
    }
    if (this.playerOrder[0] !== playerId) {
      throw new Error('Whoops! Wrong player')
    }
    if (this.players[this.playerOrder[0]].pile.length === 0) {
      throw new Error('Whoops! No cards left')
    }
    //cards pile
    var tempCard = this.players[this.playerOrder[0]].pile.splice([this.players[this.playerOrder[0]].pile.length-1], 1)
    this.pile.push(tempCard[0])
    //count
    var allPlayers = Object.keys(this.players).map(key => this.players[key])
    var count = 0
    allPlayers.forEach(function(p) {
      if (p.pile.length === 0) {
        count = 1
      }
    })
    if (count === allPlayers.length) {
      this.isStarted = false
      throw new Error('Whoops! Tie')
    }
    this.nextPlayer()
    return  {
      card: tempCard,
      cardString: tempCard.toString()
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error('Whoops! The game has not started!')
    }
    var last = this.pile.length - 1
    var pileToCut = this.players[playerId].pile

    const gamePile = this.pile
    const playerPile = this.players[playerId].pile

    const jackOnTop = this.pile[last].value === 11
    const topTwo = this.pile[last - 1] && this.pile[last].value === this.pile[last - 1].value
    const sandwich = this.pile[last - 2] && this.pile[last - 2].value === this.pile[last].value

    if (jackOnTop || topTwo || sandwich){
      // add game pile to the end of player's
      this.players[playerId].pile = [...gamePile, ...playerPile]
      // reset game pile
      this.pile = []

      return {winning: this.isWinning(playerId), message: 'got the pile!'}
      // const playerPile = playerPile.concat(gamePile)

    } else {
      const numberOfCardsLeft = Math.min(3, playerPile.length)
      // add player's at most 3 cards to the game pile
      this.pile = [
        ...playerPile.slice(playerPile.length - numberOfCardsLeft , playerPile.length), // players card
        ...this.pile
      ]

      //take at most 3 cards from the player's pile
      this.players[playerId].pile = playerPile.slice(0, playerPile.length - numberOfCardsLeft)
      return { winning: false, message: 'lost 3 cards!' }
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
