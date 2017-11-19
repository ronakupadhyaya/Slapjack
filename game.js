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
    username = username.trim();
    if(this.isStarted){
      throw("Error: cannot add player while game is in progress.");
    }
    if(!username){
      throw("Error: valid player not provided.")
    }
    for(var key in this.players){
      if(this.players.hasOwnProperty(key)&&this.players[key].username === username){
        throw('Error: cannot add duplicate player');
      }
    }
    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;
    return newPlayer.id;
  }

  startGame() {
    //THROW ERROR IF GAME IS ALREADY STARTED.
    if(this.isStarted){
      throw("Error: cannot restart while game is in progress.");
    }
    //THROW ERROR IF THE GAME DOES NOT HAVE AT LEAST 2 PLAYERS.
    if(this.playerOrder.length<2){
      throw("Error: game must have at least two players.");
    }
    //START GAME
    this.isStarted = true;
    //CREATE A NEW SHUFFLED DECK
    var deck = this.newDeck();
    //DISTRIBUTE CARDS AS EVENLY AS POSSIBLE BETWEEN ALL OF THE PLAYERS.
    var playerIndex = 0;
    while(deck.length>0){
      var id = this.playerOrder[playerIndex];
      this.players[id].pile.push(deck.pop());
      playerIndex++;
      if(playerIndex === this.playerOrder.length){
        playerIndex = 0;
      }
    }
  }

  newDeck(){
    var suits = ["hearts", "diamonds", "spades", "clubs"];
    var deck  = [];
    suits.forEach(function(suit){
      for(var value = 1; value < 14; value++){
        deck.push(new Card(suit,value));
      }
    });
    return _.shuffle(deck);
  }

  nextPlayer() {
    //THROW ERROR IF GAME HASN'T STARTED YET.
    if(!this.isStarted){
      throw("Error: cannot rotate player order until game has begun.");
    }
    var playerId = this.playerOrder.shift();
    while(this.players[this.playerOrder[0]].pile.length===0){
      this.playerOrder.push(playerId);
      playerId = this.playerOrder.shift();
    }
    this.playerOrder.push(playerId);
  }

  isWinning(playerId) {
    //THROW ERROR IF GAME HASN'T STARTED YET.
    if(!this.isStarted){
      throw("Error: cannot check winning status until game has begun.");
    }
    var numCards = this.players[playerId].pile.length;
    if(numCards === 52){
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    //THROW ERROR IF GAME HASN'T STARTED YET.
    if(!this.isStarted){
      throw("Error: cannot play card until game has begun.");
    }
    //THROW ERROR IF PLAYER IS ATTEMPTING TO PLAY OUT OF TURN
    if(this.playerOrder[0]!==playerId){
      throw(`Error: ${this.players[playerId].username} attempting to play out of order.`);
    }
    //THROW ERROR IF PLAYER IS ATTEMPTING TO PLAY WITH NO CARDS
    if(this.players[playerId].pile.length===0){
      throw(`Error: ${this.players[playerId].username} attempting to play with no cards.`);
    }
    //MOVE THE TOP CARD OF THE PLAYER'S PILE TO THE TOP CARD OF THE GAME PILE
    var card = this.players[playerId].pile.pop();
    this.pile.push(card);

    //COUNT THE NUMBER OF PLAYERS WITH NO CARDS REMAINING
    var count = 0;
    var self = this;
    this.playerOrder.forEach(function(id){
      if(self.players[id].pile.length===0){
        count++;
      }
    });
    if(count === this.playerOrder.length){
      this.isStarted = false;
      throw("Error: It's a tie!");
    }
    this.nextPlayer();
    return {
      card: card,
      cardString: card.toString()
    }
  }

  slap(playerId) {
    //THROW ERROR IF GAME HASN'T STARTED YET.
    if(!this.isStarted){
      throw("Error: cannot slap until game has begun.");
    }
    //GET THE VALUES OF THE TOP THREE CARDS TO CHECK FOR A WINNING SLAP
    var winningSlap = false;
    var i = this.pile.length - 1;
    var topThree = [];
    topThree.push(this.pile[i] ? this.pile[i].value : false);
    topThree.push(this.pile[i-1] ? this.pile[i-1].value : false);
    topThree.push(this.pile[i-2] ? this.pile[i-2].value : false);
    if(topThree[0]===11 ||
      (topThree[1] && topThree[0] === topThree[1]) ||
      (topThree[2] && topThree[0] === topThree[2]) ){
        winningSlap = true;
    }

    if(winningSlap){
      this.players[playerId].pile.unshift(...this.pile);
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      };
    }
    else{
      var playerPileLength = this.players[playerId].pile.length;
      var cardsToTake = Math.min(3,playerPileLength);
      var burnedCards = this.players[playerId].pile.splice(playerPileLength-cardsToTake-1, cardsToTake);
      this.pile.unshift(...burnedCards);
      return {
        winning: false,
        message: 'lost 3 cards!'
      };
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
