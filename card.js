String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

class Card {
  constructor(suit, value) {
    this.value = value;
    this.suit = suit;
  }

  toString() {
    if (this.value === 1) {
      this.value = "Ace"
    }
    else if (this.value === 11) {
      this.value = "Jack"
    }
    else if (this.value === 12) {
      this.value = "Queen"
    }
    else if (this.value === 13) {
      this.value =  "King"
    }
    return this.value + " of " + this.suit.capitalize()
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
