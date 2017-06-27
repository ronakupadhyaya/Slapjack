class Card {
  constructor(suit, value) {
    this.value = value;
    this.suit = suit;
  }

  toString() {
    var name;
    switch(this.value){
      case: 1:
        name = "Ace";
        break;
      case: 11:
        name = "Jack";
        break;
      case: 12:
        name = "Queen";
        break;
      case: 13:
        name = "King";
        break;
      default:
        name = this.value.toString();
    }
    var ans = name + ' of ' + this.suit;
    console.log("Name is", ans);
    return ans;
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
