class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
  }

  toString() {
    var val = '' + this.value;
    switch (this.value) {
      case 1:
        val = 'Ace';
        break;
      case 11:
        val = 'Jack';
        break;
      case 12:
        val = 'Queen';
        break;
      case 13:
        val = 'King';
        break;
    }

    this.suit = this.suit.charAt(0).toUpperCase() + this.suit.slice(1);

    return (val + ' of ' + this.suit);
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