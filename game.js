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
      throw new Error("Game has already started. Cannot add more players");
    }
    if (username.trim() === '') {
      throw new Error("Invalid username");
    }
    for (var key in this.players) {
      if (this.players[key].username === username) {
        throw new Error("Username is not unique");
      }
    }
    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;
    return newPlayer.id;
  }

  startGame() {
    if (this.isStarted) {
      throw new Error("Game has already started. Cannot add more players");
    }
    if (Object.keys(this.players).length < 2) {
      throw new Error("Cannot start with fewer than 2 players");
    }
    this.isStarted = true;
    var deck = [];
    var suits = ["hearts", "spades", "clubs", "diamonds"];
    for (var value = 1; value <= 13; value++) {
      for (var suit = 0; suit < suits.length; suit++) {
        var card = new Card(suits[suit], value);
        deck.push(card);
      }
    }
    //console.log(deck.length);
    _.shuffle(deck); // shuffle cards
    var numCards = Math.floor(52/Object.keys(this.players).length);
    // distribute cards evenly first
    for (var id in this.players) {
      for (var i = 0; i < numCards; i++) {
        this.players[id].pile.push(deck.pop());
      }
    }
    // if there are left over cards
    var temp = 0;
    for (var i = 0; i < deck.length; i++) {
      this.players[this.playerOrder[temp]].pile.push(deck[i]);
      temp++;
    }
  }

  nextPlayer() {
    if (!this.isStarted) {
      throw new Error("Game has not started")
    }
    var nextId = this.playerOrder[1]
    var firstId = this.playerOrder[0]
    // rotate first
    var shift_item = this.playerOrder.shift();
    this.playerOrder.push(shift_item);
    while (this.players[nextId].pile === []) { // keep rotating until find a player with a non-empty hand
      shift_item = this.playerOrder.shift();
      this.playerOrder.push(shift_item);
      firstId = this.playerOrder[0];
      nextId = this.playerOrder[1];
    }
  }

  isWinning(playerId) {
    if (!this.isStarted) {
      throw new Error("Game has not started")
    }
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    if (!this.isStarted) {
      throw new Error("Game has not started")
    }
    if (this.playerOrder[0] !== playerId) {
      throw new Error("It's not your turn!")
    }
    if(this.players[playerId].pile.length === 0) {
      throw new Error("You don't have any cards to play")
    }
    this.pile.push(this.players[playerId].pile.pop()) // move the top card from the player's hand to the game pile
    var zeroCards = 0;
    for (var id in this.players) { // count number of players without cards
      if (this.players[id].pile.length === 0) {
        zeroCards++;
      }
    }
    if (zeroCards === Object.keys(this.players).length) {
      throw new Error("It's a tie!")
    }
    this.nextPlayer();
    var newCard = this.pile[this.pile.length - 1] // newCard is the card on top of pile
    return {
       card: newCard,
       cardString: newCard.toString()
    }
  }

  slap(playerId) {
    if (!this.isStarted) {
      throw new Error("Game has not started")
    }
    var topCard = this.pile[this.pile.length - 1];
    var secondCard = this.pile[this.pile.length - 2];
    var thirdCard = this.pile[this.pile.length - 3];
    console.log('topCard', topCard);
    if (topCard.value === 11 ||
        topCard.value === secondCard.value ||
        this.pile.length > 2 && topCard.value === thirdCard.value) { // topcard is a jack
      this.players[playerId].pile = this.pile.concat(this.players[playerId].pile);
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    }
    else {
      // if the player slapped wrong, take away 3 cards unless they have fewer cards
      for (var i = 0; i < Math.min(3, this.players[playerId].pile.length); i++) {
        this.pile.unshift(this.players[playerId].pile.pop());
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
