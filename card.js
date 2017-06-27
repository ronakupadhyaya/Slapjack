class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
  }

  toString() {
    var num;
    switch(this.value) {
      case 1:
        num = "Ace"
        break;
      case 11:
        num = "Jack"
        break;
      case 12:
        num = "Queen"
        break;
      case 13:
        num = "King"
        break;
      defualt:
        num = this.value
    }
    return num + " of " + this.suit.charAt(0).toUpperCase() + this.suit.slice(1)
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
