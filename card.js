

var a = ['','Ace ','2 ','3 ','4 ', '5 ','6 ','7 ','8 ','9 ','10 ','Jack ','Queen ','King '];
function inWords (num) {
  if(!!a[num]) {
  return a[num]
  }
}

function capitalizeFirstLetter(string) {
return string.charAt(0).toUpperCase() + string.slice(1);
}

class Card {
  constructor(suit, value) {
    this.suit = suit,
    this.value = value
  }

  toString() {
    var suit = capitalizeFirstLetter(this.suit)
    return (inWords(this.value) + "of " + suit)
  }

  // var Card = new Card() EXAMPLE
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
