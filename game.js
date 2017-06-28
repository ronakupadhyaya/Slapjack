var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    this.isStarted  = false;
    this.players = {};
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    var self = this;
    if (self.isStarted){
      throw new Error("The Game has already Started");
    }
    if (!username.trim()){
      throw new Error("You must enter a username");
    }
    var exists = false;
    var vals = _.values(self.players)
    vals.forEach(function(item){
      if (item.username === username){
        exists = true;
      }
    })
    if (exists){
      throw new Error("That username is already taken");
    }
    else{
      var newPlayer = new Player(username);
      self.playerOrder.push(newPlayer.id);
      self.players[newPlayer.id] = newPlayer;
      return newPlayer.id;

    }
  }

  startGame() {
    var self = this;
    if (self.isStarted){
      throw new Error("The Game has already Started");
    }
    if (Object.keys(self.players).length < 2){
      throw new Error("Need two or more players");
    }
    else{
      self.isStarted = true;
      var suits = ['hearts', 'spades','clubs','diamonds']
      for (var i = 0; i < 4; i++) {
        for (var j = 1; j < 14; j++) {
          self.pile.push(new Card(suits[i],j))
        }
      }
      self.pile = _.shuffle(self.pile)
      var playerz = Object.keys(self.players)
      var count = 0;
      while (self.pile.length > 0){
        self.players[playerz[count%playerz.length]].pile.push(self.pile.pop())
        count++;
      }
    }
  }

  nextPlayer() {
    var self = this;
    if (!self.isStarted){
      throw new Error("The Game has not Started");
    }
    var done = false;
    while (!done){
      self.playerOrder.push(self.playerOrder.shift())
      if (self.players[self.playerOrder[0]].pile.length >0){
        done = true;
      }
    }
  }

  isWinning(playerId) {
    var self = this;
    if (!self.isStarted){
      throw new Error("The Game has not Started");
    }
    else{
      if (self.players[playerId].pile.length === 52 || self.players[playerId].pile.length> 52){
        self.isStarted = false;
        return true;
      }else{
        return false;
      }

    }
  }

  playCard(playerId) {
    var self = this;
    if (!self.isStarted){
      throw new Error("The Game has not Started");
    }

    if (!(self.playerOrder[0]===playerId)){
      throw new Error("it is not this players turn")
    }
    if (self.players[playerId].pile.length === 0){
      throw new Error("Your pile is empty")
    }else{
      var newCard = self.players[playerId].pile.pop()
      self.pile.push(newCard);
      var vals = _.values(self.players)
      var zeros = 0;
      vals.forEach(function(item){
        if (item.pile.length === 0){
          zeros++
        }
      })
      if (zeros === self.playerOrder.length){
        self.isStarted = false;
        throw new Error("It's a tie!");
      }
      self.nextPlayer();
      var returnObj = {card:newCard, cardString:newCard.toString()}
      return returnObj
    }
  }

  slap(playerId) {
    var self = this;
    if (!self.isStarted){
      throw new Error("The Game has not Started");
    }else{
      var last = self.pile.length - 1;
      if (self.pile.length > 2 && (self.pile[last].value === self.pile[last - 2].value || self.pile[last].value === self.pile[last - 1].value || self.pile[last].value === 11)){
        self.players[playerId].pile = [...self.pile, ...self.players[playerId].pile];
        self.pile = [];
        return {winning: self.isWinning(playerId), message: "got the pile!"}
      }else{
        var length = Math.min(3,self.players[playerId].pile.length);
        for (var i = 0; i < length; i++) {
          self.pile.unshift(self.players[playerId].pile.pop());
        }
        return {winning: false, message: "lost 3 cards!"}
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
