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
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw new Error('the game is already started');
    } else if (username.trim() === "") {
      throw new Error('username cannot be empty');
    } else {
      var unique = true;
      for (var key in this.players) {
        if (this.players[key].username === username) {
          unique = false;
        }
      }
      if (!unique) {
        throw new Error('username must be unique');
      } else {
        var newPlayer = new Player(username);
        this.playerOrder.push(newPlayer.id);
        this.players[newPlayer.id] = newPlayer;
        return newPlayer.id;
      }
    }
  }

  startGame() {
    // YOUR CODE HERE
    var self = this;
    if (self.isStarted) {
      throw new Error('the game is already started');
    } else if (self.playerOrder.length < 2) {
      throw new Error('the game has fewer than two people added');
    } else {
      self.isStarted = true;
      var allCards = [];
      var suitArr = ["spades","diamonds","hearts","clubs"]
      for (var i=0 ;i<4; i++) {
        var currentSuit = suitArr[i];
        for (var j=1; j<14 ;j++) {
          var newCard = new Card(currentSuit,j);
          allCards.push(newCard);
        }
      }
      for (var i = 0; i < 52; i++) {
        var index = Math.floor(Math.random() * 52);
        var temp = allCards[i];
        allCards[i] = allCards[index];
        allCards[index] = temp;
      }
      var even = Math.floor(52/self.playerOrder.length);
      var left = 52-even*self.playerOrder.length;
      self.playerOrder.forEach(function(id) {
        self.players[id].pile = allCards.splice(0,even);
      })
      for (var i=0;i<left;i++) {
        self.players[self.playerOrder[i]].pile.push(allCards.pop());
      }
    };
  }

  nextPlayer() {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error('the game is already started');
    } else {
      var prePlayer = self.playerOrder.shift();
      self.playerOrder.push(prePlayer);
      while (self.players[self.playerOrder[0]].pile.length === 0) {
        var pre = self.playerOrder.shift();
        self.playerOrder.push(pre);
      }
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error('the game is already started');
    } else {
      if (self.players[playerId].pile.length === 52) {
        this.isStarted = false;
        return true;
      } else {
        return false;
      }
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error('the game is already started');
    } else if (self.playerOrder[0] !== playerId) {
      throw new Error("player id doesn't match");
    } else if (self.players[playerId].pile.length === 0) {
      throw new Error("player has no cards");
    } else {
      var card = self.players[playerId].pile.pop();
      self.pile.push(card);
      var countZero = 0;
      for (var i=0;i<self.playerOrder.length;i++) {
        if (self.players[self.playerOrder[i]].pile.length === 0) {
          countZero++;
        } else {
          break;
        }
      }
      if (countZero === self.playerOrder.length) {
        self.isStarted = false;
        throw new Error("it's a tie!!");
      } else {
        this.nextPlayer();
        var returnObj = {card:card,cardString:card.toString()};
        return returnObj;
      }
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    var self = this;
    if (!self.isStarted) {
      throw new Error('the game is already started');
    } else {
      if ( (self.pile.length>0 && self.pile[self.pile.length-1].value === 11) ||
           (self.pile.length>1 && self.pile[self.pile.length-1].value === self.pile[self.pile.length-2].value) ||
           (self.pile.length>2 && self.pile[self.pile.length-1].value === self.pile[self.pile.length-3].value)
         ) {
           var concatArr = self.pile.concat(self.players[playerId].pile);
           self.players[playerId].pile = concatArr;
           self.pile =[];
           var returnObj = {winning:self.isWinning(playerId),message: 'got the pile!'};
           return returnObj;
      } else {
        if (self.players[playerId].pile.length > 2){
          for (var i=0; i<3;i++) {
            self.pile.unshift(self.players[playerId].pile.pop());
          }
        } else {
          var concatArr = self.players[playerId].pile.concat(self.pile);
          self.pile = concatArr;
          self.players[playerId].pile = [];
        }
        var returnObj ={winning: false, message: 'lost 3 cards!'};
        return returnObj;
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
