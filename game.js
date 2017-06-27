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
    if(this.isStarted) throw new Error("The game is already in progress, cannot add new players")

    if(!username.length) throw new Error('The username is not valid')

    //object.values gives you an array of the player objects
    var playerArr = _.values(this.players);
    playerArr.forEach(function(player){
      if(player.username === username) throw new Error('The username is already in use')
    })

    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer; //ading the player to the player object
    return newPlayer.id;

  }

  startGame() {
    if(this.isStarted) throw new Error('The game has already started')

    if(this.playerOrder.length < 2) throw new Error('You cannot start a game with less than 2 players')

    this.isStarted = true;

    var suitArr = ['Hearts', 'Diamonds', 'Spades', 'Clubs']
    for(var i = 1; i < 14; i++ ) {
      for(var j = 0; j < 4; j++) {
        var newCard = new Card(suitArr[j], i)
        this.pile.push(newCard)
      }
    }
    this.pile = _.shuffle(this.pile)

    var playerIn = 0;

    for(var i = 0; i < 52; i++ ){
      if(playerIn === this.playerOrder.length) playerIn = 0;
      var currentId = this.playerOrder[playerIn];
      this.players[currentId].pile.push(this.pile.pop())
      // console.log(this.players[currentId].pile)
      playerIn++;
    }

  }
  nextPlayer() {
    if (!this.isStarted) throw ('Error: Game has not started');
    do{
      this.playerOrder.push(this.playerOrder.shift());
    } while (this.players[this.playerOrder[0]].pile.length === 0)
  }


  isWinning(playerId) {
  if(!this.isStarted) throw new Error('game has not yet started!')
  if(this.players[playerId].pile.length === 52){
    this.isStarted = false;
    return true
  }
  return false
  }

  playCard(playerId) {
    if(!this.isStarted) throw new Error('game has no yet started')

    if(this.playerOrder[0] !== playerId) throw new Error('Not the correct player to play')

    if(this.players[this.playerOrder[0]].pile.length === 0) throw new Error('Player has no cards remaining')

    var nextCard = this.players[this.playerOrder[0]].pile.pop();
    this.pile.push(nextCard);

    var count = 0;

    for(var i = 0; i < this.playerOrder.length; i++ ){
      if(this.players[this.playerOrder[i]].pile.length === 0){
        count ++;
      }
    }
    if(count === this.playerOrder.length){
      isStarted = false;
      throw new Error('Its a tie!!')
    }

    this.nextPlayer()

    var returnObj = {
      card: nextCard,
      cardString: nextCard.toString(),
    }
  }

  slap(playerId) {
    if(!this.isStarted) throw new Error('Game has not started yet')


    var hasWon = false;
    var last = this.pile.length - 1;

    //check if top card is a Jack
    if(this.pile[last].value === 11) hasWon = true;
    //check to see if two cards are the same
    if(this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value) hasWon = true;
    //check sandwich condition
    if(this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value) hasWon = true;

    if(hasWon){
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile]
      this.pile = [];
      var returnObj = {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
      return returnObj;

    }else{
      var numCards = Math.min(3, this.players[playerId].pile.length);
     var lostCards = this.players[playerId].pile.splice(this.players[playerId].pile.length-numCards,numCards);
     this.pile = lostCards.concat(this.pile);
     return {winning: false, message: 'lost 3 cards!' };
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
