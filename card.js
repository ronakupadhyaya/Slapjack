class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value;
    this.suit = suit;
  }

  toString() {
    var response = ""
    switch(this.value){
      case 13:
        response = "King";
        break;
      case 12:
        response = "Queen";
        break;
      case 11:
        response = "Jack";
        break;
      case 1:
        response = "Ace";
        break;
      default:
        response += this.value;
    }
    var suit = this.suit[0].toUpperCase() + this.suit.substring(1,this.suit.length);
    response += " of " + suit;
    return response;
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
