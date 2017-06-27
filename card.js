class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
  }

  toString() {
    var card = String(this.value);
    if (card === "1") {
      card = "Ace"
    } else if (card === "11") {
      card = "Jack"
    } else if (card === "12") {
      card = "Queen"
    } else if (card === "13") {
      card = "King"
    }
    return card + " of " + this.suit;
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
