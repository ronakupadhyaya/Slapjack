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
    //central pile
    this.pile = [];

  }

  addPlayer(username) {
    if(this.isStarted){
      throw("Game has already started");
    }
    if(!username.trim()){
      throw("Please enter a valid username");
    }
    for(var key in this.players){
      if(this.players[key].username === username){
        throw("User already added");
      }
    }
    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;
    return newPlayer.id;
  }

  startGame() {
    if(this.isStarted){
      throw("Game has already started");
    }
    if(this.playerOrder.length < 2){
      throw("Not enough players!")
    }
    this.isStarted = true;
    var suits = ["diamonds", "clubs", "hearts", "spades"];
    var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    var deck = [];
    values.forEach((value) => {
      suits.forEach((suit) => {
        var newObj = new Card(suit, value);
        deck.push(newObj);
      })
    });
    deck = _.shuffle(deck);
    var counter = 0;
    while(deck.length !== 0){
      this.players[this.playerOrder[counter]].pile.push(deck.pop());
      counter = (counter + 1) % this.playerOrder.length;
    }

  }

  nextPlayer() {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw("It hasn't started yet");
    }
    var currentplayer = this.playerOrder[0];
    this.playerOrder.shift();
    this.playerOrder.push(currentplayer);
    currentplayer = this.playerOrder[0];
    while(this.players[currentplayer].pile.length === 0){
      this.playerOrder.shift();
      this.playerOrder.push(currentplayer);
      currentplayer = this.playerOrder[0];
    }


  }

  isWinning(playerId) {
    if(!this.isStarted){
      throw("It hasn't started yet");
    }
    // YOUR CODE HERE
    if(this.players[playerId].pile.length === 52){
      this.isStarted = false;
      return true;
    } else{
      return false;
    }
  }

  playCard(playerId) {
    if(!this.isStarted){
      throw("It hasn't started yet");
    }
    if(playerId !== this.playerOrder[0]){
      throw("It's not your turn yet");
    }
    if(this.players[playerId].pile.length === 0){
      throw("You've lost");
    }
    this.pile.push(this.players[playerId].pile.pop());
    var hasZeroCards = false;
    for(var key in this.players){
      if(this.players[key].pile.length > 0){
        hasZeroCards = true;
        break;
      }
    }
    if(!hasZeroCards){
      throw("It's a tie");
    }
    this.nextPlayer();
    return {
      card: this.pile[this.pile.length-1],
      cardString: this.pile[this.pile.length-1].toString()
    }

  }

  slap(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw("It hasn't started yet");
    }
    var topCard = this.pile[this.pile.length-1];
    var secondCardCheck = this.pile.length >= 2 ? this.pile[this.pile.length-2].value === topCard.value : false;
    var thirdCardCheck = this.pile.length >= 3 ? this.pile[this.pile.length-3].value === topCard.value : false;
    if(topCard.value === 11 || secondCardCheck || thirdCardCheck){
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    } else{
      var playerPile = this.players[playerId].pile;
      if(playerPile.length >3){
        var topThreeCards = this.players[playerId].pile.splice(playerPile.length -3, 3);
        this.pile = [...topThreeCards, ...this.pile];
      } else{
        //Deaded
        this.pile = [...this.pile, ...this.players[playerId].pile];
        this.players[playerId].pile = [];

      }
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
