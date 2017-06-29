class Card {
  constructor(suit, value) {
    // YOUR CODE HERE    this.value: value
    this.value = value,   //[1, 2, 3, 4, 5, 6, 7 , 8, 9, 10, 11, 12, 13, 14]
    this.suit = suit      // ["hearts", "spades", "clubs", "diamonds"]
  }

  toString() {
    switch(this.value){
      case 1:
      return "Ace" + " of " + this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
      break;
      case 11:
      return "Jack" + " of " + this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
      break;
      case 12:
      return "Queen" + " of " + this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
      break;
      case 13:
      return "King" + " of " + this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
      break;
      default:
      return (this.value).toString() + "of" + this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
      break;
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
