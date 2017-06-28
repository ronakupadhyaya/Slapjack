var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;
var _=require('underscore');

class Game {
  constructor() {
    this.isStarted=false;
    this.players={};
    this.playerOrder=[];
    this.pile=[];


  }

  addPlayer(username) {

    if(this.isStarted){
      throw new Error ('The game already started')
    }
    if(!username.trim()){
      throw new Error ('No Username')
    }

    _.mapObject(this.players,function(val,key){
      if(val.username===username){
        throw new Error ('Username should be unique')
      }

    });

    var newPlayer = new Player(username);
    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id]=newPlayer;

    return newPlayer.id;


  }

  startGame() {
    console.log('strtt',this.isStarted)
    if(this.isStarted){
      throw new Error ('The game already started')
    };

    if(this.playerOrder.length<2){
      throw new Error ('Not Enough Players')
    }

    this.isStarted=true

    var suits=['Clubs', 'Hearts','Spades','Diamonds']
    var cards=[];



    for(var i=0; i<4;i++){
      for(var j=1;j<14;j++){
        var newCard= new Card(suits[i],j);
        cards.push(newCard);
      }
    }


    var shuffledCards=_.shuffle(cards);

    while(shuffledCards.length){

    _.mapObject(this.players,function(val,key){
      if(shuffledCards.length){
        var card= shuffledCards.pop();
        val.pile.push(card)
      }

    })
    }

  }

  nextPlayer() {
    if(!this.isStarted){
      throw new Error ('The game has not started')
    };
    var rmv= this.playerOrder.shift();
    this.playerOrder.push(rmv);
    while(this.players[this.playerOrder[0]].pile.length===0){
      var rmv= this.playerOrder.shift();
      this.playerOrder.push(rmv);
    }




  }

  isWinning(playerId) {
    if(!this.isStarted){
      throw new Error ('The game has not started')
    };

    if(this.players[playerId].pile.length===52){
      this.isStarted=false;
      return true;
    }

    return false;
  }

  playCard(playerId) {
    if(!this.isStarted){
      throw new Error ('The game has not started')
    };
    if(playerId!==this.playerOrder[0]){
      throw new Error ("It is not your turn to play")
    }
    if(this.players[playerId].pile.length===0){
      throw new Error ("You have no cards to play")
    }

    var play=this.players[playerId].pile.pop();

    this.pile.push(play);
    var numberwtZeroCards=0;

    _.mapObject(this.players,function(val,key){
      if(val.pile.length===0){
        numberwtZeroCards++;;
      }

    });

    if(numberwtZeroCards===this.playerOrder.length){
      this.isStarted=false;
      throw new Error("It's a tie")
    }

    this.nextPlayer();

    return {
      card: play,
      cardString:play.toString(),
      cardImage:play.toImglabel()
    }


  }

  slap(playerId) {
    if(!this.isStarted){
      throw new Error ('The game has not started')
    };

    if(this.pile.length > 0 && this.pile[this.pile.length-1].value===11
    || this.pile.length > 1&& this.pile[this.pile.length-1].value===this.pile[this.pile.length-2].value
    || this.pile.length > 2&& this.pile[this. pile.length-1].value===this.pile[this.pile.length-3].value){

      var newPile=this.pile.concat(this.players[playerId].pile);
      this.players[playerId].pile=newPile;
      this.pile=[];
      return{
        winning:this.isWinning(playerId),
        message:'got the pile!'
      };

    }else{
      if(this.players[playerId].pile.length<3){
        var newPile=this.players[playerId].pile.concat(this.pile);
        this.pile=newPile;
        this.players[playerId].pile=[];
      }else{
        var fine= this.players[playerId].pile.splice(this.players[playerId].pile.length-3,3);
        var newPile=fine.concat(this.pile);
        this.pile=newPile;

      }

    return{
      winning:false,
      message:'lost 3 cards!'
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
