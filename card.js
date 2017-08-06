class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value;
    this.suit = suit;
  }

  toString() {
    // YOUR CODE HERE
    var output = '';
    var value = this.value;
    var suit = this.suit;

    if(value===1){
      value = 'Ace';
    } else if(value===11){
      value = 'Jack';
    } else if(value===12){
      value = 'Queen';
    } else if(value===13){
      value = 'King';
    }

    if(suit==='spades'){
      suit = 'Spades'
    } else if(suit==='clubs'){
      suit = 'Clubs'
    } else if(suit==='hearts'){
      suit = 'Hearts'
    } else if(suit==='diamonds'){
      suit = 'Diamonds'
    }


    output = value + ' of ' + suit;
    return output;
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
