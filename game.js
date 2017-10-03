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
      throw "Game already started";
    }
    if (!username.trim()) {
      throw "Username is empty";
    }
    if (this.usernameExists(username)) {
      throw "User already exists";
    }
    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;
    return newPlayer.id;
  }

  startGame() {
    if (this.isStarted)
      throw "Game already started";
    if (Object.keys(this.players).length < 2)
      throw "More than 1 player needed"
    this.isStarted = true;
    var suits = ["Spades", "Hearts", "Clubs", "Diamonds"];
    for (var s = 0; s < suits.length; s++) {
      for (var i = 1; i < 14; i++) {
        this.pile.push(new Card(suits[s], i));
      }
    }
    _.shuffle(this.pile);

    while (this.pile.length > 0)
      for (var id in this.players)
        if (this.pile.length)
          this.players[id].pile.push(this.pile.pop());
  }

  nextPlayer() {
    if (!this.isStarted)
      throw "Game has not yet started";
    this.playerOrder.push(this.playerOrder.shift());
  }

  isWinning(playerId) {
    if (!this.isStarted)
      throw "Game has not yet started";
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    if (!this.isStarted)
      throw "Game has not yet started";
    if (playerId !== this.playerOrder[0])
      throw "Not this player's turn.";
    if (!this.players[playerId].pile.length)
      throw "This player is pileless!";
    var newCard = this.players[playerId].pile.pop();
    this.pile.push(newCard);

    var counter = 0;
    for (var id in this.players) {
      if (this.players[id].pile.length === 0)
        counter++
    }
    if (counter === Object.keys(this.players).length) {
      this.isStarted = false;
      throw "Issa tie";
    }
    this.nextPlayer();
    return {
      card: newCard,
      cardString: newCard.toString()
    }
  }

  slap(playerId) {
    if (!this.isStarted)
      throw "Game has not yet started";
    var topThree = this.pile.slice(-3);
    var len = topThree.length;
    if (topThree[len - 1].value === 11 ||
      (len >= 2 && topThree[len - 2].value === topThree[len - 1].value) ||
      (len >= 3 && topThree[len - 3].value === topThree[len - 1].value)) {
        this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
        this.pile = [];
        return {
          winning: this.isWinning(playerId),
          message: 'got the pile!'
        }
      }
    var cardsToTake = this.players[playerId].pile.length < 3 ? this.players[playerId].pile.length : 3;
    for (var i = 0; i < cardsToTake; i++) {
      this.pile.unshift(this.players[playerId].pile.pop());
    }
    console.log("\nLEN", this.pile);
    return {
      winning: false,
      message: 'lost 3 cards!'
    }
  }

  usernameExists(username) {
    for (var id in this.players) {
      if (this.players[id].username === username) {
        return true;
      }
    }
    return false
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
