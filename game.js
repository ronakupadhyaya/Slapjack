var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted = false;
    this.players = {}
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted) { // If game already started, throw an error
      throw Error('Game has already started!')
    }
    var trimmedUser = username.trim()
    if (!trimmedUser) { // If no username inputted, throw an error
      throw Error("Username is empty!")
    }
    for (var key in this.players) { // Iterate through all players
      if (this.players[key].username === username ) { // if username already exists, throw an error
        throw Error("Username already exists!")
      }
    }
    // No Error Thrown
    var newPlayer = new Player(username) // Create new Player object
    this.playerOrder.push(newPlayer.id) // Push Player ID into playerOrder
    this.players[newPlayer.id] = newPlayer // Put Player Object in this.player
    return newPlayer.id // return Player ID

  }

  startGame() {
    // YOUR CODE HERE
  }

  nextPlayer() {
    // YOUR CODE HERE
  }

  isWinning(playerId) {
    // YOUR CODE HERE
  }

  playCard(playerId) {
    // YOUR CODE HERE
  }

  slap(playerId) {
    // YOUR CODE HERE
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
