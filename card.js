class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit=suit;
    this.value=value;
  }

  toString() {
    // YOUR CODE HERE
    var stringVal;
    if(this.value===1){
      stringVal='Ace'
    } else if(this.value===11){
      stringVal='Jack'
    } else if(this.value===12){
      stringVal='Queen'
    } else if(this.value===13){
      stringVal='King'
    } else {
      stringVal = this.value.toString()
    };
    var suit= this.suit[0].toUpperCase().concat(this.suit.slice(1));
    return stringVal.concat(' of ',suit)
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
