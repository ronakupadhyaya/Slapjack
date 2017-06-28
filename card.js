class Card {
  constructor(suit, value) {
    this.value = value;
    this.suit = suit;
  }

  toString() {
    var suitName;
    if (this.suit === "spades")
      suitName = "Spades";
    else if (this.suit === "hearts")
      suitName = "Hearts";
    else if (this.suit === "clubs")
      suitName = "Clubs";
    else if (this.suit === "diamonds")
      suitName = "Diamonds"

    if (this.value === 1)
      return "Ace of " + suitName;
    else if (this.value === 11)
      return "Jack of " + suitName;
    else if (this.value === 12)
      return "Queen of " + suitName;
    else if (this.value === 13)
      return "King of " + suitName;
    else
      return this.value + " of " + suitName;
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
