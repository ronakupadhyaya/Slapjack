class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit;
    this.value = value;
  }

  toString() {
    // YOUR CODE HERE
    var value = "";
    if (this.value === 1) {
      value = "Ace";
    } else if (this.value === 11){
      value = "Jack";
    } else if (this.value === 12){
      value = "Queen";
    } else if (this.value === 13){
      value = "King";
    } else {
      value = this.value.toString();
    }
    var suit = this.suit.charAt(0).toUpperCase()+this.suit.slice(1)
    var str = value + " of " + suit;
    return str;
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
