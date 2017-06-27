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
      throw new Error('Game has not started');
    }

    var firstPlayer;
    do {
      var currentPlayerId = this.playerOrder.shift();
      this.playerOrder.push(currentPlayerId);
      firstPlayer = _.findWhere(this.players, {id: this.playerOrder[0]});
    } while(firstPlayer.pile.length === 0);

  }

  isWinning(playerId) {
    if(!this.isStarted){
      throw new Error('Game has not started');
    }
    var player = _.findWhere(this.players, {id: playerId});
    if(player.pile.length === 52){
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    // catch errors
    if(!this.isStarted){
      throw new Error('Game has not started');
    }
    if(playerId !== this.playerOrder[0]){
      throw new Error('Player is out of turn.');
    }
    var currPlayer = _.findWhere(this.players, {id: playerId});
    if(currPlayer.pile.length === 0){
      throw new Error('Player has no cards.');
    }
    // move players card to game pile
    var currCard = currPlayer.pile.pop();
    this.pile.push(currCard);
    // error if tie
    var playersWithZero = _.filter(this.playerOrder, (playerId) => (_.findWhere(this.players, {id: playerId}).pile.length === 0));
    if(playersWithZero.length === this.playerOrder.length){
      this.isStarted = false;
      throw new Error('There is a tie!');
    }
    // move next player
    this.nextPlayer();

    return {card: currCard, cardString: currCard.toString()};
  }

  slap(playerId) {
    // catch errors
    if(!this.isStarted){
      throw new Error('Game has not started');
    }

    // var numTop = Math.min(3, this.pile.length);
    // check for winning conditions
    var firstCard = this.pile[this.pile.length-1];
    var secondCard = this.pile[this.pile.length-2];
    var thirdCard = this.pile[this.pile.length-3];
    // get current player
    var currPlayer = this.players[playerId];

    // concat piles
    if( (firstCard && firstCard.value === 11) || (secondCard && firstCard.value === secondCard.value) || (thirdCard && firstCard.value === thirdCard.value) ){
      currPlayer.pile = this.pile.concat(currPlayer.pile);
      this.pile = [];
      return {winning: this.isWinning(playerId), message: 'got the pile!'};
    }

    var numberToTake = Math.min(3, currPlayer.pile.length);
    var tempArr = currPlayer.pile.splice(currPlayer.pile.length - numberToTake, numberToTake);

    // move to pile
    this.pile = tempArr.concat(this.pile);
    return {winning: false, message: 'lost 3 cards!'};
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
