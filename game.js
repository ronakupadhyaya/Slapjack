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
    if(this.isStarted === true){
      console.log('Game has already started!');
      throw error('Game has already started');
    }

    var usernameModified = username.trim();

    if(usernameModified.length < 1){
      console.log('Username is empty');
      throw error('Username is empty');
    }

    for (var key in this.players){
      if(username === this.players[key].username){
        console.log('Username is not unique');
        throw error('Username is not unique');
      }
    }

    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;

    return newPlayer.id;
  }

  startGame() {
    // YOUR CODE HERE
    if(this.isStarted === true){
      console.log('Game has already started!');
      throw error('Game has already started');
    }

    if(Object.keys(this.players).length < 2){
      console.log('Game has fewer than 2 players');
      throw error('Game has fewer than 2 players');
    }
    var deck =[];
    this.isStarted = true;

    var suits = ['Spades', 'Clubs', 'Hearts', 'Diamonds'];
    for(var i = 0; i < suits.length; i++){
      for(var j = 1; j < 14; j++){
        deck.push(new Card(suits[i], j));
      }
    }
    var shuffledDeck = _.shuffle(deck);
    var playerIds = Object.keys(this.players);
    var numberOfPlayers = Object.keys(this.players).length;
    var numberPerPlayer = parseInt(52 / numberOfPlayers);

    for(var i = 0; i < numberOfPlayers; i++){
      this.players[playerIds[i]].pile = shuffledDeck.splice(0, numberPerPlayer);
    }

    var i = 0;
    while(shuffledDeck.length > 0){
      this.players[playerIds[i]].pile.push(shuffledDeck.pop());
      i++;
    }

  }

  nextPlayer() {
    // YOUR CODE HERE
    if(this.isStarted === false){
      console.log('Game has not started yet');
      throw error('Game has not started yet');
    }

    var first = this.playerOrder.shift();
    this.playerOrder.push(first);

    while(this.players[this.playerOrder[0]].length === 0){
      first = this.playerOrder.shift();
      this.playerOrder.push(first);
    }

  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if(this.isStarted === false){
      console.log('Game has not started yet');
      throw error('Game has not started yet');
    }

    if(this.players[playerId].pile.length === 52){
      this.isStarted = false;
      console.log('error is HERE')
      return true;
    } else{
      return false;
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if(this.isStarted === false){
      console.log('Game has not started yet');
      throw error('Game has not started yet');
    }

    if(this.playerOrder[0] !== playerId){
      console.log('Player playing out of turn');
      throw error('Player playing out of turn');
    }

    if(this.players[playerId].pile.length === 0){
      console.log('Invalid move, player has zero cards');
      throw error('Invalid move, player has zero cards');
    }

    var popped = this.players[playerId].pile.pop();
    this.pile.push(popped);

    var numberOfPlayers = Object.keys(this.players).length;
    var playerIds = Object.keys(this.players);
    var count = 0;

    for(var i = 0; i < numberOfPlayers; i++){
      if(this.players[playerId].pile.length === 0){
        count++;
      }
    }

    if(count===numberOfPlayers){
      this.isStarted = false;
      console.log('The game is a TIE');
      throw error('The game is a TIE!');
    }
    this.nextPlayer();
    var poppedString = popped.toString();
    return {
      card: popped,
      cardString: poppedString
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if(this.isStarted === false){
      console.log('Game has not started yet');
      throw error('Game has not started yet');
    }

    var topCard = this.pile.length - 1;

    var sandwich = false;
    if(this.pile.length > 2 && this.pile[topCard].value === this.pile[topCard - 2].value){
      sandwich = true;
    }

    if(this.pile[topCard].value === 11 || this.pile[topCard].value === this.pile[topCard - 1].value || sandwich){
      var thisPile = this.pile;
      var playerPile = this.players[playerId].pile;
      thisPile.forEach(function(card){
        playerPile.unshift(card);
      })
      this.pile = [];
      this.players[playerId].pile = playerPile;

      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    } else{
      var currPileLength = this.players[playerId].pile.length;
      var cardNum = Math.min(3, currPileLength)
      var throwCards = this.players[playerId].pile.splice(currPileLength - cardNum, cardNum);

      var topCard = this.players[playerId].pile.length - 1;
    var centerPile = this.pile;
    throwCards.forEach(function(card){
      centerPile.unshift(card);
    });
    this.pile = centerPile;

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
