class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.suit = suit;
    this.value = value;

  }

  toString() {
    // YOUR CODE HERE
    var dict = {1:'Ace',11:'Jack',12:'Queen',13:'King'};
    var desc = ''
    // console.info(this.suit)
    // console.info(this)
    var suit = this.suit[0].toUpperCase() + this.suit.substring(1)
    if (this.value>=2 && this.value<=10){
    desc = this.value +' of ';
    }
    else{
      desc = dict[this.value] +' of ';
    }
    desc += suit;
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
