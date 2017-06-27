var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted = false;
    this.players = {}; //represented as {id: Player} -> {"12331": Player}
    this.playerOrder = []; // order of array [0,1,3,2] // player 0 ,1,3,2
    this.pile = [] //array of card
  }

  addPlayer(username) {
    // YOUR CODE HERE
    for (var i in this.players) {
      if (this.players[i].username === username) {
        throw Error;
      }
    }
    if (this.isStarted) {
      throw new Error("Game already started");
    } else if (username.trim().length < 1) {
      throw new Error("name is empty");
    } else {
      var tmpPlayer = new Player(username);
      this.playerOrder.push(tmpPlayer.id);
      this.players[tmpPlayer.id] = tmpPlayer;
      return tmpPlayer.id;
    }
  }

  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw new Error("Game already started");
    } else if (Object.keys(this.players).length < 2) {
      throw new Error("Number of users is less then 2");
    } else {
      this.isStarted = true;
      for (var i = 1; i < 14; i++) {
        for (var j = 0; j < 4; j++) {
          switch (j) {
          case 0:
            this.pile.push(new Card("hearts", i))
            break;
          case 1:
            this.pile.push(new Card("spades", i))
            break;
          case 2:
            this.pile.push(new Card("clubs", i))
            break;
          case 3:
            this.pile.push(new Card("diamonds", i))
            break;
          }
        }
      }
      // console.log(this.pile)
      this.pile = _.shuffle(this.pile);
      while (this.pile.length > 0) {
        for (var i = 0; i < this.playerOrder.length; i++) {
          if (this.pile.length > 0) {
            console.log(this.players[this.playerOrder[i]]);
            this.players[this.playerOrder[i]].pile.push(this.pile.shift());
          } else {
            break;
          }
        }
      }
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("Game already started");
    } else {


      var flag = false;
      while (!flag) {
        var tmp = this.playerOrder.shift();
        if (this.players[this.playerOrder[0]].pile.length > 0) {
          flag = true;
        }
        this.playerOrder.push(tmp);
      }
      // while (this.players[this.playerOrder[0]].pile.length < 1) {
      //   var tmp = this.playerOrder.shift();
      //   this.playerOrder.push(tmp);
      // }
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("Game already started");
    } else {
      if (this.players[playerId].pile.length === 52) {
        this.isStarted = false;
        return true;
      } else {
        return false;
      }
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("Game already started");
    } else if (playerId !== this.playerOrder[0]) {
      throw new Error("It's not your turn");
    } else if (this.players[playerId].pile.length === 0) {
      throw new Error("the player has 0 cards");
    } else {
      this.pile.push(this.players[playerId].pile.pop());
      var count = 0;
      for (var i = 0; i < this.playerOrder.length; i++) {
        if (this.players[this.playerOrder[i]].pile.length === 0) {
          count++;
        }
      }
      if (count === this.playerOrder.length) {
        throw new Error("it's a tie");
      }
      this.nextPlayer();
      return {
        card: this.pile[this.pile.length - 1],
        cardString: this.pile[this.pile.length - 1].toString()
      }
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw new Error("Game already started");
    }
    var last = this.pile.length - 1;
    if (this.pile[last].value === 11 ||
      this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value ||
      this.pile[last].value === this.pile[last - 1].value
    ) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    } else {
      var tmpArr = [];
      for (var i = 0; i < Math.min(3, this.players[playerId].pile.length); i++) {
        tmpArr.push(this.players[playerId].pile.pop());
      }
      this.pile = [...tmpArr, ...this.pile];
    }
    return {
      winning: false,
      message: 'lost 3 cards!'
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
