class Card {
  constructor(suit, value) {
    this.value = value,
    this.suit = suit
  }

  toString() {
    var valueString = this.value;
    var suitString;
    if(this.value > 10 || this.value === 1) {
      var cardAssignment = {1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King'}
      valueString = cardAssignment[this.value]
    }

    //capitalizes the first letter
    var suitString = this.suit.charAt(0).toUpperCase() + this.suit.slice(1);


    var str = `${valueString} of ${suitString}`;
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
