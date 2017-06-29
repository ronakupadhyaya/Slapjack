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
    // check if can add player
    if (this.isStarted) {
      throw new Error("cannot add player: game has already started");
    }
    if (! username.trim()) {
      throw new Error("cannot add player: invalid username");
    }
    for (var p in this.players) {
      if (this.players[p].username.trim() === username) {
        throw new Error("cannot add player: username not unique");
      }
    }
    //if reach this point, add player
    var player = new Player(username);
    this.playerOrder.push(player.id);
    this.players[player.id] = player;
    return player.id;
  }

  startGame() {
    if (this.isStarted) {
      throw new Error("cannot start game: game already started");
    }
    if (Object.keys(this.players).length < 2) {
      throw new Error("cannot start game: not enough players");
    }
    //start game: bool value
    this.isStarted = true;
    //create deck
    var deck = [];
    var suits = ["spades", "clubs", "diamonds", "hearts"];
    var s = 0;
    while(s < 4) {
      var v = 1;
      while (v < 14) {
        var card = new Card(suits[s], v);
        deck.push(card);
        v++;
      }
      s++;
    }
    //shuffle deck
    deck = _.shuffle(deck);
    //deal out cards: if not even number, some players have one extra card
    var p = 0;
    var numCards = Math.round(deck.length / this.playerOrder.length);
    var extraCards = deck.length % this.playerOrder.length;
    for (var p=0; p < this.playerOrder.length; p++) {
      var pid = this.playerOrder[p];
      var plyr = this.players[pid];
      for (var n=0; n < numCards; n++) {
          plyr.pile.push(deck.pop());
      }
      if (p < extraCards) {
        plyr.pile.push(deck.pop());
      }
      // console.log('player '+p+' deck of size: '+plyr.pile.length);
    }
  }

  nextPlayer() {
    //check for game in play
    if (! this.isStarted) {
      throw new Error("cannot get next player: game not started yet");
    }
    //shift player to end
    this.playerOrder.push(this.playerOrder.shift());
    //keep shifting until first player has non zero number of cards
    while (this.players[this.playerOrder[0]].pile.length <=0) {
      this.playerOrder.push(this.playerOrder.shift());
    }
  }

  isWinning(playerId) {
    if (! this.isStarted) {
      throw new Error("cannot check if winning: game not started yet");
    }
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }

    return false;
  }

  playCard(playerId) {
    //check for errors
    if (! this.isStarted) {
      throw new Error('cannot play card: game not started');
    }
    if (playerId !== this.playerOrder[0]) {
      throw new Error('cannot play card: invalid player turn');
    }
    if (this.players[playerId].pile.length <= 0) {
      throw new Error('cannot play card: player out of cards');
    }
    //get top card from player, put into top place of game pile
    var card = this.players[playerId].pile.pop();
    this.pile.push(card);
    //check if this player won
    if (this.players[playerId].pile.length === 0) {
      console.log('this player should win here');
    }
    //count players with no cards: end as tie if all players without cards
    var countZero = 0;
    for (var p=0; p<this.playerOrder.length; p++) {
      var plyr = this.players[this.playerOrder[p]];
      if (plyr.pile.length <= 0) {
        countZero++;
      }
    }
    if (countZero === this.playerOrder.length) {
      this.isStarted = false;
      throw new Error("game over: tie! all players have no cards")
    }
    //if game continues, call next player
    this.nextPlayer();
    return {
      card: card,
      cardString: card.toString()
    }
  }

  slap(playerId) {
    //check error
    if (! this.isStarted) {
      throw new Error("cannot slap: game not started");
    }
    //check for winning conditions
    var last = this.pile.length - 1;
    var pl = this.pile;
    var isWin = false;
    if (pl[last].value === 11) {
      isWin = true;
    } else if (last >=1 && pl[last].value === pl[last-1].value) {
      isWin = true;
    } else if (last >= 2 && pl[last].value === pl[last-2].value) {
      isWin = true;
    }
    //if winning slap, put game pile into bottom of player's pile (beginning of array)
    if (isWin) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = [];

      return { winning: this.isWinning(playerId), message: 'got the pile!'};
    } else {
      //if not winning slap, take at max 3 cards from player and put into game pile
      var num = Math.min(3, this.players[playerId].pile.length);
      for (var n=0; n<num; n++) {
        this.pile.unshift(this.players[playerId].pile.pop());
      }
      return {winning: false, message: 'lost '+num+' cards!'}
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
