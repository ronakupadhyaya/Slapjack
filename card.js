class Card {
  constructor(suit, value) {
    // if (value <= 13 && value >= 1) {
    this.value = value;
    // }
    this.suit = suit;
  }

  toString() {
    var num = this.value;
    if (num === 1) {
      num = "Ace";
    } else if (num === 11){
      num = "Jack";
    } else if (num === 12){
      num = "Queen";
    } else if (num === 13){
      num = "King";
    }
    var suit = this.suit.substring(0,1).toUpperCase()
    +this.suit.substring(1);
    return num+" of "+suit;
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
