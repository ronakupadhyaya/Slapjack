// "use strict";``
var Game = require('./game');

describe("The Game Object", function() {
  describe(".addPlayer", function() {
    var g;
    beforeEach(function() {
      g = new Game();
    });
    
    it("should create a new player object, add it to the player order, and return the id of the newly created player", function() {
      expect(g.playerOrder.length).toBe(0);
      expect(g.addPlayer('Ethan')).toBe(jasmine.any(String));
      expect(g.playerOrder.length).toBe(1);
    });
    
    it("should throw an error when trying to add a username of someone already playing", function() {
      g.addPlayer('Ethan');
      expect(g.addPlayer('Ethan')).toThrow();
    });
    
    it("should throw an error trying to add a player when the game has started", function() {
      g.addPlayer('Ethan');
      g.isStarted = true;
      expect(g.addPlayer('Ethan')).toThrow();
    });
  });
  
  decribe(".startGame", function() {
    var g;
    beforeEach(function() {
      g = new Game();
    });
    
    it("should throw an error if there are less than two people playing", function() {
      expect(g.playerOrder.length).toBe(0);
      g.addPlayer('Ethan');
      expect(g.startGame()).toThrow();
    });
    
    it("should start the game only if more than two people have been added", function() {
      expext(g.playerOrder.length).toBe(0);
      g.addPlayer('Ethan');
      g.addPlayer('Josh');
      g.startGame();
      expect(g.isStarted).toBe(true);
    });
  });
  
  describe(".isWinning", function() {
    var g;
    beforeEach(function() {
      g = new Game();
    });
    
  });
  
  describe(".playCard", function() {
    var g;
    beforeEach(function() {
      g = new Game();
    });
    
  });
  
  describe(".slap", function() {
    var g;
    beforeEach(function() {
      g = new Game();
    });
    
  });

  
});
