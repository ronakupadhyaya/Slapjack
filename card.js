class Card {
  constructor(suit, value) {
    this.value = value;
    this.suit = suit;
  }

  toString() {
    const symbols = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' }
    return `${symbols[this.value] || this.val} of ${this.suit[0].toUpperCase()}${this.suit.slice(1)}`;
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
