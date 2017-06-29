var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    this.isStarted = false,
    this.players = {},
    this.playerOrder = [],
    this.pile = []
  }

  addPlayer(username) {
    if(typeof username !== 'string') {
      throw ('Username needs to a string')
    }
    if(this.isStarted) {
      throw ('The game has already began')
    }
    if(username.trim() === '') {
      throw ('The username is empty')
    }
    for (var key in this.players) {
      if(this.players[key].username === username) {
        throw ('Username is not unique')
      }
    }

    var newPlayer = new Player(username)

    this.playerOrder.push(newPlayer.id);
    this.players[newPlayer.id] = newPlayer;
    return newPlayer.id
  }

  startGame() {
    //id of all players in the room (can replace with playerOrder)

    if(this.isStarted) {
      throw ('Game has already began');
    }
    if(this.playerOrder.length < 2) {
      throw ('Not enough players to start the game')
    }

    this.isStarted = true;
    //creates deck
    var deck = [];
    var valueParam = 1;
    var suitParam = 0;
    var suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    for (var i = 0; i < 52; i++) {
      if(valueParam > 13) {
        valueParam = 1;
        suitParam++;
      }
      var card = new Card(suits[suitParam], valueParam);
      deck.push(card);
      valueParam++;
    }
    var shuffledDeck = _.shuffle(deck);
    var numLeftOver = shuffledDeck.length % this.playerOrder.length;

    var playerIndex = 0;
    while(shuffledDeck.length > 0) {
        if(playerIndex > this.playerOrder.length - 1) {
          playerIndex = 0;
        }
        this.players[this.playerOrder[playerIndex]].pile.push(shuffledDeck[shuffledDeck.length - 1])
        shuffledDeck.pop();
        playerIndex++;
    }

  }

  nextPlayer() {
    if(!this.isStarted) {
      throw ('The game hasn\'t started yet');
    }

    var lastPlayer = this.playerOrder.splice(0, 1);
    this.playerOrder.push(lastPlayer[0])



    while(this.players[this.playerOrder[0]].pile.length === 0) {
      this.nextPlayer();
    }

  }

  isWinning(playerId) {
    if(!this.isStarted) {
      throw ('The game has yet to start')
    }
    if(this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    }

    return false;

  }

  playCard(playerId) {
    if(!this.isStarted) {
      throw ('The game has yet to start')
    }
    if(playerId !== this.playerOrder[0]) {
      throw ('It\'s not your turn yet')
    }
    if(this.players[playerId].pile.length === 0) {
      throw ('You have no cards!')
    }
    var playersLastCard = this.players[playerId].pile.pop();
    this.pile.push(playersLastCard);
    if(this.pile.length === 52) {
      this.isStarted = false;
      throw('It\'s a tie!');
    }
    this.nextPlayer();
    //cardString not working as well as I would like
    return {card: playersLastCard, cardString: playersLastCard.toString()}
  }

  slap(playerId) {
    if(!this.isStarted) {
      throw ('The game has not started yet')
    }
    var lastCard = this.pile.length - 1;
    var winnerObj = {'winning': this.isWinning(playerId), 'message': 'got the pile!'}
    if(this.pile[lastCard].value === 11) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = []
      return winnerObj
    }
    if(this.pile[lastCard].value === this.pile[lastCard - 1].value) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = []
      return winnerObj
    }

    if(this.pile.length > 2 && this.pile[lastCard].value === this.pile[lastCard - 2].value) {
      this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
      this.pile = []
      return winnerObj
    }

    var lastThreeCards;
    if(this.players[playerId].pile.length > 3) {
      lastThreeCards = this.players[playerId].pile.splice(this.players[playerId].pile.length - 3, 3);
    } else {
      lastThreeCards = this.players[players].pile.splice(this.players[players].pile.length - 1)
    }
    this.pile = [...lastThreeCards, ...this.pile];


    return {'winning': false, message: 'lost 3 cards!'}
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
