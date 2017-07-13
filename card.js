class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit
    this.value = value
  }

  toString() {
    // YOUR CODE HERE
    var string = this.suit.split("");
    string[0] = string[0].toUpperCase();
    var finalString = string.join("")

    switch (this.value) {
      case 1:
        return "Ace of " + finalString
        break;
      case 11:
        return "Jack of " + finalString
        break;
      case 12:
        return "Queen of " + finalString
        break;
      case 13:
        return "King of " + finalString
        break;
      default:
        return this.value + " of " + finalString;
        break;
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
