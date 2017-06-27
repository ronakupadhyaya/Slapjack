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
      // console.log("game already start3ed in addplayer");
      throw new Error("cant add player game has already started");
    }
    if(!username.trim()){
      console.log("error addplayuer no username");
      throw new Error("cant add player wtih no username");
    }
    // var uniq = true;
    for(var key in this.players){
      // console.log(key);
      if(this.players[key].username == username){
        console.log("error username taken");
        throw new Error("username taken");

      }
    }

    var player = new Player(username);
    this.playerOrder.push(player.id);
    this.players[player.id] = player;
    return player.id;
  }





  startGame() {
    // YOUR CODE HERE
    if(this.isStarted){
      console.log("error game is already started");
      throw new Error("game already started");

    }
    if(Object.keys(this.players).length <2){
      console.log(" error too few players");
      throw new Error("too few players");
    }

    this.isStarted = true;
    var deck = [];
    var suits = ["hearts", "diamonds", "spades", "clubs"];
    suits.forEach(function(suit){
      for (var i = 1; i <= 13; i++) {
        deck.push(new Card(suit,i));
      }
    })
    deck = _.shuffle(deck);
    // console.log(deck);
    var numplayercards = parseInt(52/Object.keys(this.players).length);
    var leftovercards = 52%Object.keys(this.players).length;

    for(var playerid in this.players){
      // console.log("player");
      this.players[playerid].pile = deck.splice(0,numplayercards)
    }

    for (var i = 0; i < leftovercards; i++) {
      for(var playerid in this.players){
        if(deck.length>0){

          this.players[playerid].pile.push(deck.pop());
        }
      }
    }


  }



  nextPlayer() {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("game already started");
    }

    do{
      var first = this.playerOrder.shift();
      this.playerOrder.push(first);
    } while(this.players[this.playerOrder[0]].pile.length ===0)
  }


  isWinning(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("game already started");
    }
    if(this.players[playerId].pile.length ===52){
      this.isStarted = false;
      return true;
    }
    return false;
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("game already started");
    }
    if(playerId !== this.playerOrder[0]){
      throw new Error("not playersa turn");
    }
    if(this.players[playerId].pile.length ===0){
      throw new Error("player has no cards cant play");
    }

    var card = this.players[playerId].pile.pop();
    this.pile.push(card);
    var nocardplayers = 0;
    for(var playerid in this.players){
      if(this.players[playerid].pile ===0){
        nocardplayers++;
      }

    }
    if(Object.keys(this.players).length === nocardplayers){
      this.isStarted = false;
      throw new Error("no one has any cards");
    }

    this.nextPlayer();
    return {card: card, cardString: card.toString()}

  }

  slap(playerId) {
    // YOUR CODE HERE
    if(!this.isStarted){
      throw new Error("game already started");
    }
    var decklen = this.pile.length;
    var iswin = false;
    if(decklen >=1 && this.pile[decklen-1].value === 11){
      iswin = true;
    } else if(decklen >=2 && this.pile[decklen-1].value === this.pile[decklen-2].value){
      iswin= true;
    } else if(decklen >=3 && this.pile[decklen-1].value === this.pile[decklen-3].value){
      iswin = true;
    }

    if(iswin){
      var currentplayerpile = this.players[playerId].pile;
       this.players[playerId].pile = this.pile.concat(currentplayerpile);
       this.pile = [];
       return {winning: this.isWinning(playerId), message: 'got the pile!'}
    }else{
      var playerpilelen = this.players[playerId].pile.length;
      var numcards = Math.min(3,playerpilelen);
      var removedcards = this.players[playerId].pile.splice(playerpilelen-numcards, numcards);
      var currentdeck = this.pile;
      this.pile = removedcards.concat(currentdeck);
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
