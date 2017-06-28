class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit;
    this.value = value;
  }

  toString() {
    // YOUR CODE HERE
    var val, suit;
    if (this.value === 1) {
      val = 'Ace';
    }
    else if (this.value === 11) {
      val = 'Jack';
    }
    else if (this.value === 12) {
      val = 'Queen';
    }
    else if (this.value === 13) {
      val = 'King';
    }
    else {
      val = this.value.toString();
    }
    suit = this.suit[0].toUpperCase() + this.suit.substring(1);
    return val + ' of ' + suit;
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
