class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit;
    this.value = value;
  }

  toString() {
    // YOUR CODE HERE
    function c(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    if (this.value !== 1 && this.value < 11) {
      return this.value+' of '+c(this.suit);
    } else if (this.value === 1) {
      return 'Ace of '+c(this.suit);
    } else if (this.value === 11) {
      return 'Jack of '+c(this.suit);
    } else if (this.value === 12) {
      return 'Queen of '+c(this.suit);
    } else if (this.value === 13) {
      return 'King of '+c(this.suit);
    } else {
      return 'Card not in correct format';
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
