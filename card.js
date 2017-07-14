class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value,
    this.suit = suit,
    this.name = this.toString()
  };

  toString() {
    // YOUR CODE HERE
    var face = '';
    switch(this.value) {
      case 11:
        face = 'Jack';
        break;
      case 12:
        face = 'Queen';
        break;
      case 13:
        face = 'King';
        break;
      case 1:
        face = 'Ace';
        break;
      default:
        face = this.value;
    }
    return face + ' of ' + this.suit.charAt(0).toUpperCase() + this.suit.substring(1);;
  };

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
