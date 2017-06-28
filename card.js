class Card {
  constructor(suit, value) {
    this.suit=suit
    this.value=value
  }

  toString() {
    var val="";
    if(this.value===1){
      val="Ace"
    }else if(this.value===11){
      val="Jack"
    }else if(this.value===12){
      val="Queen"
    }else if(this.value===13){
      val="King"
    }else{
      val=this.value;
    }

    var suit=this.suit.charAt(0).toUpperCase()+this.suit.slice(1);


    return val + ' of ' + suit
  }

  toImglabel() {
    var val="";
    if(this.value===1){
      val="ace"
    }else if(this.value===11){
      val="jack"
    }else if(this.value===12){
      val="queen"
    }else if(this.value===13){
      val="king"
    }else{
      val=this.value;
    }

    var suit=this.suit.charAt(0).toLowerCase()+this.suit.slice(1);


    return val + '_of_' + suit+'.svg'
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
