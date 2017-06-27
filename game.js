var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    this.isStarted = false;
    // id: object {username: }
    this.players = {};
    this.playerOrder = [];
    this.pile = [];
  }

  addPlayer(username) {
    var username = username.trim();
    // catch errors
    if(this.isStarted){
      throw new Error('Players cannot be added when game is in session!');
    }
    if(!username){
      throw new Error('You must specify a valid username.');
    }
    if( _.findWhere(this.players, {username: username}) ){
      throw new Error('Username is already taken.');
    }
    // create player
    var newPlayer = new Player(username);
    // push to order
    this.playerOrder.push(newPlayer.id);
    // add to players object
    this.players[newPlayer.id] = newPlayer;

    return newPlayer.id;
  }

  startGame() {
    // catch errors
    if(this.isStarted){
      throw new Error('Players cannot be added when game is in session!');
    }
    if(this.playerOrder.length < 2){
      throw new Error('Not enough players');
    }
    // do stuff
    this.isStarted = true;
    // shuffle deck
    var suitType = ['hearts', 'spades', 'clubs', 'diamonds']
    var deck = [];
    for(var i = 0 ; i < suitType.length; i++){
      for(var j = 1 ; j <= 13; j++){
        deck.push(new Card(suitType[i], j));
      }
    }
    deck = _.shuffle(deck);

    var count = 0;
    while(deck.length){
      // access the current player's pile
      var currPlayer = _.findWhere(this.players, {id: this.playerOrder[count]});
      currPlayer.pile.push(deck.pop());
      count++;
      if(count >= this.playerOrder.length ){
        count = 0
      }
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error('Game has already started');
    }

    // var currentPlayer=this.playerOrder.shift();
    //currentPlayer is the first item in playerOrder, but playerOrder is updated to shift
  //   var index = this.playerOrder.length;
  //   for(var i=0;i<this.playerOrder;i++){
  //       var currPlayer = _.findWhere(this.players, {id: this.playerOrder[i]});
  //       if (currPlayer.pile.length===0){
  //         index = i;
  //         break;
  //       }
  //   }
  //   this.playerOrder.splice(index,0,currentPlayer)

  var firstPlayer;
  do {
    var currentPlayerId = this.playerOrder.shift();
    this.playerOrder.push(currentPlayerId);
    firstPlayer = _.findWhere(this.players, {id: this.playerOrder[0]});
  } while(firstPlayer.pile.length === 0);

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
