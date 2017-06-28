var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;
var losersArray = []

class Game {
  constructor() {
    this.isStarted = false
    this.players = {}
    this.playerOrder = []
    this.pile = []
  }

  addPlayer(username) {
    //Error tests
    if(this.isStarted) {
      throw new Error("Game already started")
    }

    if(!username.trim()) {
      throw new Error("Empty username")
    }

    var found = false
    var tempPlayers = this.players
    this.playerOrder.forEach(function(id){
      if (username === tempPlayers[id].username) {
        found = true
      }
    })
    if(found) {
      throw new Error("Username taken")
    }

    //Add to game
    var p1 = new Player(username)
    this.players[p1.id] = p1;

    this.playerOrder.push(p1.id)

    return p1.id
  }

  startGame() {
    if(this.isStarted) {
      throw new Error("Game already started")
    }
    if(this.playerOrder.length<2) {
      throw new Error("Not enough players")
    }
    else {
      this.isStarted = true

      //create the deck
      var createDeck = function() {
        var deck = []
        var suit = ["hearts", "spades", "diamonds", "clubs"]
        var value = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
        //LOOP THROUGH SUITS
        for (var j=0; j<suit.length; j++) {
          //FOR LOOP FOR VALUE SYMBOL
          for (var i=0; i<value.length; i++) {
            var card = new Card(suit[j], value[i])
            deck.push(card)
          }
        }
        _.shuffle(deck)
        return deck
      }

      var deck = createDeck()
      var playerObj = this.players
      var numberOfPlayers = this.playerOrder.length


      while(deck.length>0) {
        this.playerOrder.forEach(function(id){
          var card = deck.pop();
          if(card) {
            playerObj[id].pile.push(card)
          }
        })
      }

    } //from else
    return true
  }

// var losersArray = [] //last index is the winner

  nextPlayer() {
    if(!this.isStarted) {
      throw new Error("Game already started")
    }

    else {

      var id = this.playerOrder[0]
      if (this.players[id].pile.length === 0) { //if they have no cards
        var loser = this.playerOrder.shift() //take them out of the game
        losersArray.push(loser)
          nextPlayer() //will recal to check next player
      }

      var frontSide = this.playerOrder.shift()
      this.playerOrder.push(frontSide) // pushes front side into back side
    }//from else
  }

  isWinning(playerId) {
    if(!this.isStarted) {
      throw new Error("Game already started")
    }

    if(this.players[playerId].pile.length === 52) {
      this.isStarted = false
      return true
    }
    return false
  }

  playCard(playerId) {

    //ERRORS
    if(!this.isStarted) {
      throw new Error("Game already started")
    }
    if(playerId != this.playerOrder[0]) {
      throw new Error("Not TODAY!")
    }
    if(this.players[playerId].pile.length === 0) {
      throw new Error("You done foo")
    }

    //Take from player and give to game pile
    var newCard = this.players[playerId].pile.pop()
    this.pile.push(newCard)

    //Check if its a tie
    if(this.pile.length === 52) {
      throw new Error("its a tie")
    }

    //call next player
    this.nextPlayer()

    //return the card that was played
    return {
      card: newCard,
      cardString: newCard.toString()
    }

  }

  slap(playerId) {

    var last = this.pile.length-1
    var secondLast = this.pile.length-2
    var thirdLast = this.pile.length-3
    var playerLast = this.players[playerId].pile.length - 1

    // console.log('player pile length minus one', playerLast)

    // console.log('pile',this.pile)
    // console.log('length',this.pile.length)
    // console.log('value of last',this.pile[last].value)
    // console.log('value of second',this.pile[secondLast].value)
    // console.log('value of third',this.pile[thirdLast].value)
    // console.log(this.pile.length > 1 && this.pile[last].value === this.pile[secondLast].value);



    //ERRORS
    console.log('PILE', this.pile)
    console.log('PILE LAST', this.pile[last].value)
    if(!this.isStarted) {
      throw new Error("Game already started")
    }
    // If the top card of the pile is a Jack



    else if ( (this.pile[last].value === 11) ||
    (this.pile.length > 1 && this.pile[last].value === this.pile[secondLast].value) ||
    (this.pile.length > 2 && this.pile[last].value === this.pile[thirdLast].value)) {

      var self = this;
      this.pile.forEach(function(card) {
        self.players[playerId].pile.unshift(card)
      })
        this.pile = []
        console.log('pile', this.pile)
        console.log('pile length', this.pile.length)
        return {
          winning: self.isWinning(playerId),
          message: 'got the pile!'
        }
    } //from else

    else {
      var numToTake = Math.min(3, this.players[playerId].pile.length)
      // console.log('player pile length minus one', playerLast)
      // console.log('number we are taking', numToTake)
      var pileLength = playerLast
      for(var i = pileLength; i>pileLength-numToTake; i--) {
        this.pile.unshift(this.players[playerId].pile.pop())
      }
      return {
        winning: false,
        message: 'lost 3 cards!'
      }
    }
  }//slap

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
