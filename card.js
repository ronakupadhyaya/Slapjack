class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value;
    this.suit = suit;
  }

  toString() {
    // YOUR CODE HERE
    var valueString = this.value;
    var suitString = this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
    if (valueString === 1) {
      valueString = "Ace"
    } else if (valueString === 11) {
      valueString = "Jack"
    } else if (valueString === 12) {
      valueString = "Queen"
    } else if (valueString === 13) {
      valueString = "King"
    }
    return valueString + " of " + suitString;
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
