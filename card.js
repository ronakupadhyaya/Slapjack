class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
  }

  toString() {
    var obj = {1:"Ace", 11:"Jack", 12:"Queen", 13: "King"};
    if (this.value === 1 || this.value>10){
      return obj[this.value] + " of " + this.suit;
    }else{
      return this.value + " of " + this.suit;
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
