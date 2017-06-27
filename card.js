class Card {


  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value;
    this.suit = suit;
  }

  toString() {
    var tmpValue = this.value;
    if (this.value === 1) {
      tmpValue = "Ace"
    } else if (this.value === 11) {
      tmpValue = "Jack";
    } else if (this.value === 12) {
      tmpValue = "Queen"
    } else if (this.value === 13) {
      tmpValue = "King"
    }
    return tmpValue + " of " + this.suit;

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
