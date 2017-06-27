class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value;
    this.suit = suit;
  }

  toString() {
    // YOUR CODE HERE
    if (this.value === 1) {
      return 'Ace of ' + this.suit;
    }
    if (this.value === 11) {
      return 'Jack of ' + this.suit;
    }
    if (this.value === 12) {
      return 'Queen of ' + this.suit;
    }
    if (this.value === 13) {
      return 'King of ' + this.suit;
    }
    return this.value + ' of ' + this.suit;
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
