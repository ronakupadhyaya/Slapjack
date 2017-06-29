class Card {
  constructor(suit, value) {
    this.value = value;
    this.suit = suit;
  }

  toString() {
    var str = '';
    if (this.value === 1) {
      str += 'Ace';
    } else if (this.value === 11) {
      str += 'Jack';
    } else if (this.value === 12) {
      str += 'Queen';
    } else if (this.value === 13) {
      str += 'King';
    } else {
      str += this.value;
    };
    str += ' of ' + this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
    return str;
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
