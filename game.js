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
      throw new Error("Game already started");
    }else if ( ! (username.trim())  ){
      throw new Error("Username is empty");
    }else{
      //check that it is unique
      for(var key in this.players){
        if(this.players[key].username === username){
          throw new Error("Username is not unique")
        }
      }

      //NO ERRORS THROWN
      var player = new Player(username);
      this.playerOrder.push(player.id);
      this.players[player.id] = player;
      return player.id;

    }
  }

  startGame() {
    // YOUR CODE HERE
    if(this.isStarted){
      throw new Error("Game already started");
    }else if(Object.keys(this.players).length < 2){
      throw new Error("Less than two players")
    }else{
      this.isStarted = true;

      var deck = []

      for(var j = 1; j <= 13; j++){
        var card = new Card('spades', j)
        deck.push(card)
      }
      for(var j = 1; j <= 13; j++){
        var card = new Card('hearts', j)
        deck.push(card)
      }
      for(var j = 1; j <= 13; j++){
        var card = new Card('diamonds', j)
        deck.push(card)
      }
      for(var j = 1; j <= 13; j++){
        var card = new Card('clubs', j)
        deck.push(card)
      }

      deck = _.shuffle(deck);

      //DISTRIBUTE CARDS EVENLY
      var num_players = Object.keys(this.players).length;
      var rounds = Math.floor(52/num_players)

      for(var key in this.players){
        for(var i = 0; i < rounds; i++){
          this.players[key].pile.push(deck.pop());
        }
      }

      //HANDLE LAST REMAINDER
      var leftover = 52 % num_players;
      for(var j = 0; j < leftover; j++){
        this.players[this.playerOrder[j]].pile.push(deck.pop())
      }

    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("Game has not started yet")
    }else{
      //console.log(this.playerOrder);
      //console.log(this.players[this.playerOrder[0]].pile.length);

      do{
        var shift_item = this.playerOrder.shift();
        this.playerOrder.push(shift_item)
      }
      while(this.players[this.playerOrder[0]].pile.length === 0);

      //console.log(this.playerOrder);

    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("Game has not started yet")
    }else{
      if(this.players[playerId].pile.length === 52){
        this.isStarted = false;
        return true;
      }else{
        return false;
      }
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("Game has not started yet")
    }else if(this.playerOrder[0] !== playerId){
      throw new Error("Playing out of order dumbie")
    }else if(this.players[playerId].pile.length === 0){
      throw new Error("This player has no cards in his pile")
    }else{
      var card = this.players[playerId].pile.pop();
      this.pile.push(card)

      var count_empty = 0;
      var num_players = Object.keys(this.players).length;

      for(var key in this.players){
        if(this.players[key].pile.length === 0){
          count_empty++;
        }
      }

      if(count_empty === num_players){
        isStarted = false;
        throw new Error("It is a tie!!")
      }

      this.nextPlayer();

      return {
        card: card,
        cardString: card.toString()
      }
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("Game has not started yet")
    }else{
      var length = this.pile.length;

      if(this.pile[length-1].value === 11
          || this.pile[length-1].value === this.pile[length-2].value
          || length > 2 && this.pile[length-1].value === this.pile[length-3].value){
            //winning routine
            var arr = this.pile;

            while(this.players[playerId].pile.length !== 0){
              arr.push(this.players[playerId].pile.shift())
            }

            this.players[playerId].pile = arr;

            this.pile = [];
            return {
              winning: this.isWinning(playerId),
              message: 'got the pile!'
            }
      }else{

        for(var i = 0; i < Math.min(3,this.players[playerId].pile.length); i++){
          this.pile.unshift(this.players[playerId].pile.pop());
        }

        return {
          winning: false,
          message: 'lost 3 cards!'
        }

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
