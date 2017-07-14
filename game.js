var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted = false,
    this.players = {},
    this.playerOrder = [],
    this.pile = []
  };

  addPlayer(username) {
    // YOUR CODE HERE
    username = username.trim()
    if(this.isStarted) {
      throw new Error('Game has already started');
    } else if(username.length === 0 || username === '') {
      throw new Error('Username must not be ');
    }
    var check=false;
    for(var key in this.players){
      if(username===this.players[key].username){
        check=true;
      }
    }
    if(check) {
      throw new Error('Username is already taken');
    }
    var newplayer = new Player(username);
    this.playerOrder.push(newplayer.id);
    this.players[newplayer.id] = newplayer;
    return newplayer.id;
  }

  startGame() {
    // YOUR CODE HERE
    if(this.isStarted) {
      throw new Error('Game has already started');
    }
    var count = 0;
    for (var key in this.players) {
      count++;
    }
    if(count < 2) {
      throw new Error('Not enough players');
    }
    this.isStarted = true;


    // Create a card deck
    var ranks = new Array(1,2,3,4,5,6,7,8,9,10,11,12,13);

    var suits = new Array("clubs", "diamonds", "hearts", "spades");

    for (var i = 0; i < suits.length; i++) {
        for (var j = 0; j < ranks.length; j++) {
          if(this.pile.length != 52) {
            this.pile[i*ranks.length + j] = new Card(suits[i], ranks[j]);
          }
        }
    }

    // Shuffle the deck
    this.pile = _.shuffle(this.pile);

    while(this.pile.length > 0) {
      for(var player in this.players) {
        var card = this.pile.pop();
        if(typeof card === 'object') {
          this.players[player].pile.push(card);
        }
      }
    }
    if(this.pile.length !== 0) {
      console.log('Something went wrong');
    }

  }

  nextPlayer() {
    // YOUR CODE HERE
    if(!this.isStarted) {
      throw new Error('Game has not started yet')
    }
    while(true) {
      var player1 = this.playerOrder.shift()
      this.playerOrder.push(player1);
      if(this.players[this.playerOrder[0]].pile.length !== 0) {
        break;
      }
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted) {
      throw new Error('Game has not started yet')
    }
    var count = 0; var playercount = 0;
    var won = false;
    for(var player in this.players) {
      if(this.players[player].pile.length === 0) {
        count++;
      }
      playercount++;
    }
    if(playercount === count) {
      won = true;
    }
    if(this.players[playerId].pile.length === 52 || won) {
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted) {
      throw new Error('Game has not started yet')
    }
    if(this.playerOrder[0] !== playerId) {
      throw new Error('Player out of turn');
    }
    if(this.players[playerId].pile.length === 0) {
      throw new Error('Player has run out of cards');
    }

    var newcard = this.players[playerId].pile.pop();
    this.pile.push(newcard);
    var count = 0;
    for(var player in this.players) {
      if (this.players[player].pile.length === 0) {
        count++;
      }
    }

    if(count === this.playerOrder.length) {
      this.isStarted = false;
      throw new Error('Tie game!')
    }

    this.nextPlayer();

    var output = {
      card: newcard,
      cardString: newcard.toString()
    };
    return output;
  }

  slap(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted) {
      throw new Error('Game has not started yet')
    }
    if(this.pile.length > 2 && (this.pile[this.pile.length-1].value === 11 || this.pile[this.pile.length-1].value === this.pile[this.pile.length-2].value || this.pile[this.pile.length-1].value === this.pile[this.pile.length-3].value)) {
      var everything = this.pile;
      this.pile = [];
      this.players[playerId].pile = [...everything, ...this.players[playerId].pile];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    } else {
      if(this.players[playerId].pile.length < 3) {
        var badcards = this.players[playerId].pile;
        this.players[playerId].pile = [];
      } else {
        var badcards = this.players[playerId].pile.splice(this.players[playerId].pile.length-3, 3);
      }
      this.pile = [...badcards, ...this.pile];
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
