class Card {
  constructor(suit, value) {
    this.value = value;
    this.suit = suit;
  }

  toString() {
    var suit = this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
    switch (this.value) {
      case 1:
        return `Ace of ${suit}`
      case 11:
        return `Jack of ${suit}`
      case 12:
        return `Queen of ${suit}`
      case 13:
        return `King of ${suit}`
      default:
        return `${this.value} of ${suit}`
    }
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
