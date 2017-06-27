function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit;
    this.value = value;
  }

  toString() {
    // YOUR CODE HERE
    var wordvalue = this.value+" of ";
    if(this.value === 1){
      wordvalue = "Ace of ";
    }else if (this.value === 11){
      wordvalue= "Jack of "
    }else if (this.value === 12){
      wordvalue= "Queen of "
    }else if (this.value === 13){
      wordvalue= "King of "
    }
    return wordvalue+capitalizeFirstLetter(this.suit)
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
