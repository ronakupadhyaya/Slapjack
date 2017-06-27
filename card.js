class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
  }

  toString() {
    switch(this.value) {
      case 1:
        this.value = 'Ace';
        break;
      case 11:
        this.value = 'Jack';
        break;
      case 12:
        this.value = 'Queen';
        break;
      case 13:
        this.value = 'King'
        break;
    }
    switch(this.suit) {
      case 'spades':
        this.suit = 'Spades';
        break;
      case 'hearts':
        this.suit = 'Hearts';
        break;
      case 'diamonds':
        this.suit = 'Diamonds';
        break;
      case 'clubs':
        this.suit = 'Clubs'
        break;
    }

    return (this.value + " of " + this.suit)
  }

  // PERSISTENCE FUNCTIONS
  //
  // Start here after completing Step 2!
  // We have written a persist() function for you to save your game state to
  // a store.json file.
  // =====================
  fromObject(object) {
    this.value = object.value;
    this.suit = object.suit;
  }

  toObject() {
    return {
      value: this.value,
      suit: this.suit
    };
  }
}

module.exports = Card;
