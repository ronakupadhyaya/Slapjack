var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var DeckGenerator = require('cards');
var readGame = false;

class Game {
  constructor() {
    this.isStarted = false; // Boolean to tell if the game is started
    this.players = {};      // Obj container for the Player objects
    this.playerOrder = [];  // The order in which the players take their turn
    this.pile = [];         // An array of card objs representing the center pile
    this.names = [];
  }

  addPlayer(username) {
    // Handle game not started yet or empty username
    if(this.isStarted || !username.trim()) {
      throw new Error("YOU CANT DO THAT!!!!");
    }
    // Handle username that's already taken
    this.names.forEach((item)=>{
      if(item === username){
        throw new Error("Username taken!")
      }
    })
    this.names.push(username); // Save the player name to validate future player username requests
    // Make the new player
    var newPlayer = new Player(username)

    // Push player Id into this.playerOrder
    this.playerOrder.push(newPlayer.id);
    // Add the new player to the this.players object
    this.players[newPlayer.id] = newPlayer;
    // Return the id of the player
    return newPlayer.id;
  }

  startGame() {
    // Throw an error if the game has not been started.
    if(this.isStarted) {
      throw new Error("Game started already!");
    }
    // Throw error if the number of players is less than 2.
    if(Object.keys(this.playerOrder).length < 2) {
      throw new Error("You can't play by yourself!");
    }
    this.isStarted = true;                           // Start the game
    var deck = this.generateDeck();                  // Make a deck of 52 cards
    var shuffledDeck = _.shuffle(deck);              // Shuffle the deck
    this.distributeCardsToPlayers(shuffledDeck);     // Distribute cards to all players
  }

  nextPlayer() {
    // Throw an error if the game has not started yet.
    if(!this.isStarted) {
      throw new Error("Game has not been started yet!");
    }
    this.shiftArrLeft(this.playerOrder) // Shift left
    // If the current player has no cards left, we shift left
    while(this.players[this.playerOrder[0]].pile.length <= 0) {
      this.shiftArrLeft(this.playerOrder);
      console.log(playerOrder);
    }
  }

  isWinning(playerId) {
    // Throw an error if the game is not started yet!
    if(!this.isStarted) {
      throw new Error("Game has not been started yet!");
    }
    // If this player has 52 cards then they win!
    if(this.players[playerId].pile.length === 52){
      this.isStarted = false; // Set this to false so we can start a new game
      return true;
    }
    return false;
  }

  playCard(playerId) {
    // Throw an error if the game is not started!
    if(!this.isStarted) {
      throw new Error("Game has not been started yet!");
    }
    // Throw an error if the current Player ID does not match the passed-in Player ID
    // (this means a player is attempting to play a card out of turn).
    if(playerId !== this.playerOrder[0]){
      throw new Error("Wait your turn please!");
    }

    // Throw an error if the Player corresponding to the passed-in Player ID has a pile length of zero
    if(this.players[playerId].pile.length === 0){
      throw new Error("You have no cards left!");
    }

    this.pile.push(this.players[playerId].pile.pop()); // Move the top card of a Player's pile onto the top card of the Game pile.

    var countZeros = 0;
    // Count the number of players with 0 cards
    for(var key in this.players) {
      if(this.players[key].pile.length === 0) {
        countZeros += 1;
      }
    }

    if(countZeros === this.playerOrder.length) {
      var isStarted = false;
      throw new Error("It's a tie! No player has any cards left!");
    }

    this.nextPlayer();
    var newCard = this.pile[this.pile.length - 1];
    return {
      card: newCard,
      cardString: newCard.toString()
      }
  }

  slap(playerId) {
    if(!this.isStarted) {
      throw new Error("Game has not been started yet!");
    }
    var player = this.players[playerId];

    var foundWinningCondition = this.checkForWinningCondition(); // Check for one of the winning conditions
    // If there is a winning slap condition, move the pile into the back of the pile of the Player
    if(foundWinningCondition) {
      player.pile = [...this.pile, ...player.pile];
      this.pile = [];
      return {
        winning: this.isWinning(playerId),
        message: 'got the pile!'
      }
    }
      // Otherwise, take the top 3 cards (at most) from the pile of the Player
      // corresponding to the passed-in Player ID and add it to the BOTTOM of the game pile
      for(var i = 0; i < 3; i++){
        if(player.pile.length > 0) {
          this.pile.unshift(player.pile.splice(0, 1)[0]);
        }
      }
       return {
         winning: false,
         message: 'lost 3 cards!'
       }


  }

  // Helper function: Returns a new deck of 52 cards
  generateDeck() {
    var newDeck = [];
    ['clubs', 'diamonds', 'hearts', 'spades'].forEach((suit) => {
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach((value) => {
            var newCard = new Card(suit, value);
            newDeck.push(newCard);
        });
    });
    return newDeck;
  }

  // Helper function: Distributing the cards at the start game
  distributeCardsToPlayers(deck) {
    console.log(deck);
    while(deck.length > 0){
      for(var key in this.players) {
        if(deck.length > 0) {
          // put the top card in the deck in the current player pile
          var card = deck[0];
          deck.splice(0, 1);
          console.log(card);
          this.players[key].pile.push(card);
        };
      }
    }
  }

  // Helper Function: Shift array left by 1
  shiftArrLeft(arr){
    if(arr.length <= 1) return arr;
    // Save the first element
    var firstEle = arr.splice(0, 1)[0];
    arr.push(firstEle);
    return arr;
  }

  checkForWinningCondition(){
    var last = this.pile.length - 1;
    // If the top card in the pile is a Jack return true
    if(this.pile[last].value === 11) {return true;}
    // Error checking
    if(this.pile.length < 2) {return false;}
    // If the top 2 cards in the pile are the same value, return true
    if(this.pile[last].value === this.pile[last - 1].value) {return true;}
    // Error checking
    if(this.pile.length < 3) {return false;}
    // If the 1st and 3rd cards are the same, return true
    if(this.pile[last].value === this.pile[last - 2].value){return true}
    // If none of the above are true, we return false
    return false;

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
