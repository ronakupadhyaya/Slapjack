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
    if(this.isStarted){
      throw new Error("game has already started");
    }
    if (!username){
      throw new Error("username is empty");
    }
    for (var playerId in this.players){
      if(this.players[playerId].username === username){
        throw new Error("the name is already being used");
      }
    }

    var newPlayer = new Player(username);
    this.players[newPlayer.id] = newPlayer;
    this.playerOrder.push(newPlayer.id);
    return newPlayer.id;
  }

  // else if (this.players.forEach(function(player) {
  //   if(player[playerId].username === username) {
  //     return true;
  //   }
  // }))
  // { throw new Error("pick a username that is not being used");  }



  startGame() {
    // YOUR CODE HERE
    if(this.isStarted){
      throw new Error("game is already in play");
    }
    if(Object.keys(this.players).length < 2){
      throw new Error("you cannot play against urself");
    }
    this.isStarted = true;
    var tempDeck = [];
    var suitsArr = ["Spades", "Hearts", "Diamonds", "Clubs"];
    for(var i = 0; i < 13; i++){
      for (var j = 0; j < 4; j++){
        var newCard = new Card(suitsArr[j], i);
        tempDeck.push(newCard);
      }
    }
    console.log(tempDeck.length);
    var shuffledDeck = _.shuffle(tempDeck);
    var numPlayers = Object.keys(this.players).length;
    var iterator = Math.ceil(52 / numPlayers);
    var counter = 0;
    for(var i = 0; i < iterator; i++){
      for (var playerId in this.players){
        if(counter < 52){
          this.players[playerId].pile.push(shuffledDeck.pop());
        }
        counter++;
      }
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("game hasnt started yet");
    }
    this.playerOrder.push(this.playerOrder.shift());

    if(this.players[this.playerOrder[0]].pile.length === 0){
      this.nextPlayer();
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("game has not started yet");
    }
    if(this.players[playerId].pile.length === 52){
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("game has not started yet");
    }
    if(playerId !== this.playerOrder[0]){
      // console.log("testing");
      // console.log(playerId);
      // console.log(this.playerOrder[0]);
      throw new Error("playerId's do not match");
    }
    if(this.players[playerId].pile.length === 0){
      throw new Error("player has no cards");
    }

    var newCard = this.players[playerId].pile.pop();
    this.pile.push(newCard);

    var numPlayersZero = 0;
    for(var playerId in this.players){
      if(this.players[playerId].pile.length === 0){
        numPlayersZero++;
      }
    }
    if(numPlayersZero === this.playerOrder.length){
      throw new Error("its a tie!");
    }
    this.nextPlayer();
    return  {
      card: newCard,
      cardString: newCard.toString()
    }
  }

  //slap(playerId) {
  // YOUR CODE HERE
  // if(!this.isStarted){
  //   throw new Error("game has not started yet");
  // }
  //
  // var lastdex = this.pile.length - 1;
  //
  // if(this.pile[lastdex].value === 11){
  //   this.players[playerId].pile.unshift(this.pile);
  //   this.pile = [];
  //   return {
  //     winning: this.isWinning(playerId),
  //     message: 'got the pile!'
  //   }
  // }
  //
  // if(this.pile[lastdex].value === this.pile[lastdex - 1].value){
  //   this.players[playerId].pile.unshift(this.pile);
  //   this.pile = [];
  //   return {
  //     winning: this.isWinning(playerId),
  //     message: 'got the pile!'
  //   }
  // }
  // if(this.pile.length > 2 && this.pile[lastdex].value === this.pile[lastdex - 2].value){
  //   this.players[playerId].pile.unshift(this.pile);
  //   this.pile = [];
  //   return {
  //     winning: this.isWinning(playerId),
  //     message: 'got the pile!'
  //   }
  // }
  //
  // this.pile.unshift(this.players[playerId].pile.pop());
  // this.pile.unshift(this.players[playerId].pile.pop());
  // this.pile.unshift(this.players[playerId].pile.pop());
  // // this.pile.splice()
  //   return {
  //     winning: false,
  //     message: 'lost 3 cards!'
  //   }
  //}
  slap(playerId) {
    if(!this.isStarted){
      throw new Error("game has not started yet");
    }

    var lastdex = this.pile.length - 1;

    if(this.pile[lastdex].value === 11
      || this.pile[lastdex].value === this.pile[lastdex - 1].value
      || this.pile.length > 2 && this.pile[lastdex].value === this.pile[lastdex - 2].value){
        this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
        this.pile = [];
        return {
          winning: this.isWinning(playerId),
          message: 'got the pile!'
        }
      } else {
        this.pile.unshift(this.players[playerId].pile.pop());
        this.pile.unshift(this.players[playerId].pile.pop());
        this.pile.unshift(this.players[playerId].pile.pop());

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
