class Card {
  constructor(newSuit, newValue) {
    this.suit =  newSuit; // The value of the playing card, from 1-13 (where Ace is 1, Jack is 11, Queen is 12, King is 13).
    this.value = newValue; // The suit of the playing card, which any one of the following: hearts, spades, clubs, or diamonds.
  }

  // Get the human-readable description for the card, i.e. Ace of Spades, 8 of Hearts, etc.
  toString() {
    var valAsStr = this.value;
    var capitalSuit = this.suit.charAt(0).toUpperCase()
      + this.suit.slice(1);
    if(this.value === 1)  {valAsStr = "Ace"}
    if(this.value === 11) {valAsStr = "Jack"}
    if(this.value === 12) {valAsStr = "Queen"}
    if(this.value === 13) {valAsStr = "King"}
    //console.log(this.value);
    return valAsStr + " of " + capitalSuit;
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
