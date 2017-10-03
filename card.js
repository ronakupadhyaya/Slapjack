class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value;
    this.suit = suit;
  }

  toString() {
    // YOUR CODE HERE
    switch (this.value) {
      case 13:
        return "King of " + this.capitalizeFirstLetter(this.suit)
        break;
      case 12:
        return "Queen of " + this.capitalizeFirstLetter(this.suit)
        break;
      case 11:
        return "Jack of " + this.capitalizeFirstLetter(this.suit)
        break;
      case 1:
        return "Ace of " + this.capitalizeFirstLetter(this.suit)
        break;
      default:
        return this.value + ' of ' + this.capitalizeFirstLetter(this.suit)
    }
  }

  // PERSISTENCE FUNCTIONS
  //
  // Start here after completing Step 2!
  // We have written a persist() function for you to save your game state to
  // a store.json file.
  // =====================
    capitalizeFirstLetter(string) {
      console.log("STRING", string);
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

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
