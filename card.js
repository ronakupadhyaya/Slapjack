class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit
    this.value = value;
  }

  toString() {
    // YOUR CODE HERE
    var convertedV = this.value;
    var suit = this.suit.charAt(0).toUpperCase() + this.suit.slice(1)
    if (this.value === 1) {
      var convertedV = 'Ace'
    }
    else if (this.value === 11) {
      var convertedV = 'Jack'
    }
    else if (this.value === 12) {
      var convertedV = 'Queen'
    }
    else if (this.value === 13) {
      var convertedV = 'King'
    }
    return convertedV + ' of ' + suit
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
