var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted=false;
    this.players={},
    this.playerOrder=[],
    this.pile=[]


  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted){
      throw new Error ('game started')
    }
    else if (username.trim()===''){
      throw new Error ('username is empty')
    } else {
      _.each(this.players, function(player){
        if (player.username ===username){
          throw new Error ('username needs to be unique')
        }
      });

      var newPlayer= new Player(username)
      this.playerOrder.push(newPlayer.id);
      this.players[newPlayer.id] = newPlayer
      return newPlayer.id

    }
  }

  startGame() {
  //   // YOUR CODE HERE
    if (this.isStarted){
      throw new Error ('game started')
    }
    else if (_.size(this.players)<2){
      throw new Error('not enough players')
    }
    else{
      this.isStarted = true;
      var suits = ['diamonds','hearts','spades','clubs']
      for (var i = 1; i <= 13; i++) {
        for (var j = 0; j < suits.length ; j++) {
          var newCard = new Card(suits[j], i)
          this.pile.push(newCard)
        }
      }
      var pile = _.shuffle(this.pile);
      for (var i = 0; i < pile.length; i++) {
        this.players[this.playerOrder[i % _.size(this.players)]].pile.push(pile[i])
      }
      this.pile=[];
    }
  }

  nextPlayer() {
    // YOUR CODE HERE
    if (!this.isStarted){
      throw new Error ('game not started')
    }
    var current = this.playerOrder.shift();
    this.playerOrder.push(current)
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted){
      throw new Error ('game not started')
    }

    else if (this.players[playerId].pile.length===52){
      this.isStarted=false;
      return true;
    }
    else{
      return false
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted){
      throw new Error ('game not started')
    }
    else if (this.playerOrder[0]!==playerId){
      throw new Error ('not your turn')
    }
    else if (this.players[playerId].pile.length===0){
      throw new Error ('no card left')
    }

    var currentCard = this.players[playerId].pile.pop()
    this.pile.push(currentCard);

    var counter =0 ;
    _.each(this.players,function(player){
      if (player.pile.length===0){
        counter++
      }
    })
    if(counter===_.size(this.players)){
      this.isStarted=false;
      throw new Error('a tie')
    }
    this.nextPlayer();
    return { card: currentCard, cardString: currentCard.toString()  }
  }

  slap(playerId) {
    // // YOUR CODE HERE
    if (!this.isStarted){
      throw new Error ('game not started')
    }
    var last = this.pile.length - 1;
    if (this.pile[last].value===11
    || this.pile.length > 1 && this.pile[last].value === this.pile[last - 1].value
    || this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value){
      //winning
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile=[];
      return {winning: this.isWinning(playerId),message: 'got the pile!'}
    }

    else {
      // lose
      var minLen = Math.min(3, this.players[playerId].pile.length)
      var playerPile = this.players[playerId].pile
      var spliced = playerPile.splice(playerPile.length-minLen)
      this.pile = [...spliced,...this.pile];
      return {winning: false, message: 'lost 3 cards!'}
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
