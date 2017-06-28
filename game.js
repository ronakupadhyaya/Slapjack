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
    if (this.isStarted === true) {
      throw new Error("Cannot add player, new game has already started");
    }
    if (username.trim(" ") === ''){
      throw new Error("Username cannot be empty");
    }
    else {
      _.forEach(this.players,function(player, key) {
        if (player.username === username) {
          throw new Error("Username is already taken");
        }
      })
      var newPlayer = new Player(username);
      this.playerOrder.push(newPlayer.id);
      this.players[newPlayer.id] = newPlayer;
      return newPlayer.id;
    }
  }

  startGame() {
    if (this.isStarted === true) {
      throw new Error("New game has already started");
    }
    if (Object.keys(this.players).length < 2) {
      throw new Error("Cannot start game with less than two players in the game");
    }
    else {
      this.isStarted = true;
      // create a deck
      var deck = [];
      var suits = ["hearts", "spades", "diamonds", "clubs"];
      for (var i = 1; i < 14; i++) {
        for (var j = 0; j < 4; j++) {
          var newCard = new Card(suits[j], i);
          deck.push(newCard);
        }
      }
      // shuffle the deck and distribute
      deck = _.shuffle(deck);
      var deckIndex = 0;
      var numPlayers = Object.keys(this.players).length;
      while (deckIndex < 52) {
        var nextPlayer = this.players[Object.keys(this.players)[deckIndex%numPlayers]];
        nextPlayer.pile.push(deck[deckIndex]);
        deckIndex++;
      } 
    }
  }

  nextPlayer() {
    if (this.isStarted === false) {
      throw new Error("New game has already started");
    }
    else {
      this.playerOrder.push(this.playerOrder.shift());
    }
  }

  isWinning(playerId) {
    if (this.isStarted === false) {
      throw new Error("New game has already started");
    }
    else {
      if (this.players[playerId].pile.length === 52) {
        this.isStarted = false;
        return true;
      }
      else {
        return false;
      }
    }
  }

  playCard(playerId) {
    if (this.isStarted === false) {
      throw new Error("New game has already started");
    }
    if (this.playerOrder[0] !== playerId) {
      throw new Error("Not player's turn");
    }
    if (this.players[playerId].pile.length === 0) {
      throw new Error("Player does not have any cards");
    }
    else {
      // push the top of the player's pile onto the game pile
      var playedCard = this.players[playerId].pile.pop();
      this.pile.push(playedCard);
      var count = 0;
      // count number of players with 0 cards
      _.forEach(this.players,function(player, key) {
        if (player.pile.length === 0) {
          count++;
        }
      });
      if (count === Object.keys(this.players).length) {
        this.isStarted = false;
        throw new Error("It's a tie!");
      }
      this.nextPlayer();
      return {card: playedCard, cardString: playedCard.toString()}
    }

  }

  slap(playerId) {

    if (this.isStarted === false) {
      throw new Error("New game has already started");
    }
    var lastCard = this.pile.length-1;
    // If the top card is a jack, or there is a sandwich or two of a kind, player gets pile
    if ((this.pile[lastCard].value === 11) ||
        (this.pile.length >= 2 && this.pile[lastCard].value === this.pile[lastCard-1].value) || 
        (this.pile.length >= 3 && this.pile[lastCard].value === this.pile[lastCard-2].value))
    {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = [];
      return {winning: this.isWinning(playerId), message: 'got the pile!'};
    }
    else {
      // Player puts their 3 (or less) cards onto the bottom of the pile
      var len = this.players[playerId].pile.length;
      for (var i = 0; i < Math.min(3,len); i++) {
        this.pile.unshift(this.players[playerId].pile.pop());
      }
      return {winning: false, message: 'lost 3 cards!'};
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
