class Card {
  constructor(suit, value) {
    this.value = value;
    this.suit = suit;
  }

  toString() {
    var valToString = '';
    var suitToString = this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
    switch (this.value) {
      case 1:
        valToString = 'Ace';
        break;
      case 11:
        valToString = 'Jack';
        break;
      case 12:
        valToString = 'Queen';
        break;
      case 13:
        valToString = 'King';
        break;
      default:
        valToString = this.value;
        break;
    }
    return valToString + " of " + suitToString;
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
