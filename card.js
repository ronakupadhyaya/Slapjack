class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit;
    this.value = value;
  }

  toString() {
    // YOUR CODE HERE
    var str;

    switch (this.value) {
      case 1:
        str = 'Ace';
        break;
      case 11:
        str = 'Jack';
        break;
      case 12:
        str = 'Queen';
        break;
      case 13:
        str = 'King';
        break;
      default:
        str = this.value;
    }
    return str + " of " + this.suit[0].toUpperCase() + this.suit.slice(1);
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
