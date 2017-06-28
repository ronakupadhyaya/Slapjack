var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted=false;
    this.players={};
//An Object to store the Player objects by the key of an ID and value of a Player object. We should be able to access Players from this object with players[id].
    this.playerOrder=[];
    this.pile=[]; // array of Card objects
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if(this.isStarted){
      throw new Error ("this game has already started!")
    } else if(!username){
      throw new Error ("Username is empty!");
    }
    for(var key in this.players){
      if(this.players[key].username === username){
        throw new Error ("Someone already took this username!");
      }
    }
    var newPlayer = new Player(username);
    this.players[newPlayer.id]=newPlayer;
    this.playerOrder.push(newPlayer.id);
    return newPlayer.id;
  }

  startGame() {
    // YOUR CODE HERE
    if(this.isStarted){
      throw new Error ("this game has already started!")
    } else if(this.playerOrder.length<2){
      throw new Error ("this game needs more than 1 person to play")
    }
    this.isStarted=true;
    var value = 0;
    for (var i = 1; i < 14; i++) {
        this.pile.push(new Card('hearts',i));
        this.pile.push(new Card('clubs',i));
        this.pile.push(new Card('spades',i));
        this.pile.push(new Card('diamonds',i));
    }
    this.pile=_.shuffle(this.pile);
    var cardCounter=0;
    for (var i = 0; i < this.pile.length;) {
      for (var j = 0; j < this.playerOrder.length; j++) {
        this.players[this.playerOrder[j]].pile.push(this.pile[i]);
        i++;
        if(i===52){
          break;
        }
      }
    }
    this.pile=[];
  }

  nextPlayer() {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error ("this game should be started!")
    } else {
      var first=this.playerOrder[0];
      this.playerOrder.shift();
      this.playerOrder.push(first);
      while(this.players[this.playerOrder[0]].pile.length===0){
        var again=this.playerOrder[0];
        this.playerOrder.shift();
        this.playerOrder.push(again);
      }
    }
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error ("this game should be started!")
    } else {
      if(this.players[playerId].pile.length===52) {
        this.isStarted = false;
        return true;
      } else {
        return false
      }
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error ("this game should be started!")
    } else if(this.playerOrder[0]!==playerId){
      throw new Error ("This player should not play at this time.")
    } else if(this.players[playerId].pile.length===0){
      throw new Error ("This player doesn't have any cards")
    } else {
      var currentCard=this.players[playerId].pile.pop();
      this.pile.push(currentCard);
      var noCardCounter =0;
      for (var i = 0; i < this.playerOrder.length; i++) {
        if(this.players[this.playerOrder[i]].pile.lenth===0){
          noCardCounter++;
        }
      }
      if (noCardCounter===this.playerOrder.length){
        throw new Error ("It's a tie!")
      }
      this.nextPlayer();
      return {card:currentCard, cardString:currentCard.toString()}
    }
  }

  slap(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error ("this game should be started!")
    } else {
       var last = this.pile.length - 1;
      if(this.pile[last].value===11 ||
       (this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value) ||
       (this.pile.length > 2 && this.pile[last].value === this.pile[last - 1].value) ){
         // Win
         this.players[playerId].pile = this.pile.concat(this.players[playerId].pile);
         this.pile=[];
         return {
           winning: this.isWinning(playerId),
           message: 'got the pile!'
         }
       } else {
         //lose
         var taken =3;
         if(this.players[playerId].pile.length<3){
           taken = this.players[playerId].pile.length
         }
         for (var i = 0; i < taken; i++) {
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
