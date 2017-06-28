class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value
  }

  toString() {
    var valueDict = {1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King'};
    var desc = '';
    if (this.value == 1 || this.value >= 11) {
      desc = valueDict[this.value] + ' of ';
    } else {
      desc = this.value + ' of ';
    }
    desc += this.suit.charAt(0).toUpperCase()+this.suit.substring(1);
    return desc;
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
