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
    // this.persist();
  }

  addPlayer(username) {
    var players = Object.keys(this.players).map((key) => {return this.players[key]})
    players.forEach((userObj) =>
    {if(userObj.username === username){
      throw "Error: username is not unique"
    }})

    if(this.isStarted){
      throw "Error: The game is already started"
    }else if(!username.trim()){
      throw "Error: invalid username entered";
    }else{
      var newPlayer = new Player(username);
      this.playerOrder.push(newPlayer.id)
      this.players[newPlayer.id] = newPlayer;
      // this.persist();
      return newPlayer.id;
    }
  }

  startGame() {
    if(this.isStarted){
      throw "Error: The game is already started";
    }else if(Object.keys(this.players).length < 2){
      throw "Error: There are not enough players to play";
    }else{
      this.isStarted = true;
      var deck =[];
      var suits = ['hearts' , 'diamonds', 'spades', 'clubs'];
      for(var suit = 0; suit < suits.length; suit++){
        for(var value = 1; value < 14; value++){
          deck.push(new Card(suits[suit],value))
        }
      }
      deck = _.shuffle(deck);

      while(deck.length > 0){
        for(var player = 0; player < this.playerOrder.length; player++){
          if(deck.length > 0){
            var playerId = this.playerOrder[player];
            var playerObj = this.players[playerId];
            playerObj.pile.push(deck.pop());
          }
        }
      }
    }
    // this.persist()
  }

  nextPlayer() {
    if(!this.isStarted){
      throw "Error: The game is already started";
    }else{
      do{
        var currPlayer = this.playerOrder.shift();
        this.playerOrder.push(currPlayer);
      }
      while(this.players[this.playerOrder[0]].pile.length === 0)
    }
    // this.persist()
  }

  isWinning(playerId) {
    if(!this.isStarted){
      throw "Error: The game is already started";
    }else{
      if(this.players[playerId].pile.length ===52){
        this.isStarted = false;
        return true;
      }else{
        return false;
      }
    }
  }

  playCard(playerId) {
    if(!this.isStarted){
      throw "Error: The game is already started";
    }else if(this.playerOrder[0]!== playerId){
      throw("Error: Boo it isnt your turn yet")
    }else if(this.players[playerId].pile.length === 0){
      throw("Error: You suck, you have no cards")
    }else{
      var currCard = this.players[playerId].pile.pop();
      this.pile.push(currCard);
      var count = 0;
      this.playerOrder.forEach((Id) => {
        if(this.players[Id].pile.length === 0){
          count++
        }
      })
      if(count === this.playerOrder.length){
        this.isStarted = false;
        throw('Error: Everybody loses MUAHAHA')
      }
      this.nextPlayer();
      // this.persist()
      return {card:currCard,cardString:currCard.toString()}

    }
  }

  slap(playerId) {
    if(!this.isStarted){
      throw "Error: The game is already started";
    }else{
      var last = this.pile.length;
      if(this.pile[last-1].value === 11 ||
         (this.pile.length > 1 && this.pile[last-1].value === this.pile[last-2].value) ||
         (this.pile.length > 2 && this.pile[last-1].value === this.pile[last-3].value)){
           this.players[playerId].pile = this.pile.concat(this.players[playerId].pile);
           this.pile = [];
          //  this.persist()
           return {winning: this.isWinning(playerId), message: 'got the pile!'}
         }else{
           var currPlayerPile = this.players[playerId].pile;
           var len = currPlayerPile.length;
           var loss = currPlayerPile.splice(len- 1 - Math.min(3,len),3);
           this.pile = loss.concat(this.pile)
          //  this.persist()
           return {winning: false, message: 'lost 3 cards!'}

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
