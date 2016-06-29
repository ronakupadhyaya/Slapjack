// "use strict";``
var Game = require('./game');

describe("The Game Object", function() {
  describe(".addPlayer", function() {
    var g;
    beforeEach(function() {
      g = new Game();
    });
    
    it("should create a new player object, add it to the player order, and return the id of the newly created player", function() {
      expext(g.playerOrder.length).toBe(0);
      expect(g.addPlayer('Ethan')).toBe(jasmine.any(String));
      expext(g.playerOrder.length).toBe(1);
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
    
  })

  
});
