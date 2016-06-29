# Slapjack
Today, we'll be doing a fun project - implementing the multiplayer card game _Slapjack_ in a way that will allow us to deploy to Heroku and play with your friends. 

## Table of Contents

* **Rules of Slapjack**
* **Step 1:** Game Logic
* **Step 2:** Displaying Your Game
* **Step 3:** Persisting with Redis
* **The End:** Deploy, deploy, deploy!

## Rules of Slapjack
In Slapjack, the objective of the game is to have the entire deck of cards.

At the beginning of a game of Slapjack, each player is dealt an equal number of cards facedown (players are not able to see their own cards or anyone else's cards). 

The remaining cards go to a central pile. Players will then go in order, playing their cards to the pile until they reach 52 cards (_the winning condition of the game_) or have no more cards left to deal. 

Players can gain cards by "slapping" the pile - in which case they either gain the pile or lose 3 cards based on the following conditions:

* If the top card of the pile is a Jack, the player gains the pile
* If the top two cards of the pile are of the same value (i.e., two Aces, two 10's, two 2's), the player gains the pile
* If the top card and third-to-top card are of the same value (sandwich - i.e. Ace 10 Ace, 10 Ace 10), the player gains the pile
* Otherwise, the player loses 3 cards to the top of the pile

Additionally, only one person can slap a winning pile; all players slapping immediately after the first lose 3 cards.

## Step 1: Game Logic
We will isolate all of your Slapjack game's logic into a single module inside of `game.js`. Before you begin, make sure to run `npm install` to get all the dependencies you need to both start and test the application. In this step, you won't ever need to `npm start` - just run `npm test` when prompted to! In the next step, we'll be serving up the game to your connected users.

### Cards and Players - `game.js`
Begin with your `Card` object - we should only have two properties and a function for any given `Card` object:

* The value of the playing card, from 1-13 (where Ace is 1, Jack is 11, Queen is 12, King is 13)
* The suit of the playing card, which any one of the following: _hearts_, _spades_, _clubs_, or _diamonds_.
* A `toString` function that allows us to get the human-readable description for the card, i.e. _Ace of Spades_, _8 of Hearts_, etc.

Next, build out your `Player` object - your `Player` object should have three properties:

* A unique username
* A unique ID - generated upon construction
* A pile/hand of cards represented by an Array of `Card` objects

You want to create some basic properties for your `Game` object as well - below is a brief explanation of each property you need to create and how you'll be using them:

* A Boolean to check if the game is in progress or not
* A String to store the ID of the current player whose turn it is to play a card
* An Object to store the `Player` objects by the key of an ID and value of a `Player` object
	* You should be able to access `Player`s from this object with `players[id]`.
* An Array of IDs of players, representing their order in the game.
* An Array of `Card` objects representing the central pile.

Now that you have the fundamental properties for keeping track of Game state, add the definition for a `Game` prototype to allow for adding players into the game.

* `Game.prototype.addPlayer` - should take a `username` as a String
	* Throw an error if the game has already started
	* Throw an error if the username is empty
	* Throw an error if the player's username is non-unique
	* Otherwise, create a new `Player` object with a username and push them to both the `playerOrder` Array and `players` Object
	* Call `this.persist()` 
	* Return the ID of the new `Player`

> **Test:** At this point, run `npm test` to check your progress and verify that your methods are working!


### Game Starter - `game.js`

Next, we'll tackle the game logic for setting up a game. Implement the following function to handle setting up a new game:

* `Game.prototype.startGame` - begin game setup
	* Throw an error if the game has already started
	* Throw an error if the game has fewer than two people added
	* Otherwise, set your `isStarted` (or equivalent) boolean to `true`
	* Create a standard deck of 52 playing cards and shuffle them
		* **Hint:** You may find Underscore's `.shuffle` method helpful for implementing a Fisher-Yates shuffle!
	* Distribute the cards evenly amongst all players and place the remaining cards in the game pile
	* Set the current Player ID variable to the first person in the Player order
	
To finish setup, implement the following function to allow you to change your current Player ID variable as you move through your game in the functions to follow:

* `Game.prototype.nextPlayer` - move to next Player ID in Player order Array
	* Throw an error if the game is not already started
	* Find the next Player able to play (a Player with a non-zero pile length) in the Player order Array
	* Set the next Player available to the current Player ID variable

> **Test:** At this point, run `npm test` to check your progress and verify that your methods are working!

### Gameplay Functions - `game.js`
Time to implement the most important functions to support your Game - the gameplay functions! Use the following stubs to write your gameplay functions:

* `Game.prototype.isWinning` - should take a Player ID and return whether or not the Player corresponding to that ID has won
	* Throw an error if the game is not already started
	* Check for a winning condition of a Player corresponding to the `playerId` passed in and, if a win occurred, set your `isStarted` Boolean or equivalent to `false` and return true.
	* Otherwise, return `false` - the Player did not meet a winning condition.
	
* `Game.prototype.playCard` - should take a Player ID of the Player attempting to play a Card and return a String representation of the card played
	* Throw an error if the game is not already started
	* Throw an error if the current Player ID variable does not match the passed-in Player ID (this means a player is attempting to play a card out of turn)
	* Throw an error if the Player corresponding to the passed-in Player ID has a pile length of zero
	* Otherwise, move the top card of a Player's pile onto the top card of the Game pile.
	* Call `this.nextPlayer()` to set the next player's ID to the current Player ID variable.
	* Return a String representation of the Card that was played.

* `Game.prototype.slap` - should take a Player ID of the Player attempting to slap and return an Object with 
	* 



## Step 2: Displaying Your Game

### Sending WebSockets Events - `app.js`

### Receiving WebSockets Events - `views/index.hbs`

### Displaying Cards - `views/index.hbs`

## Step 3: Persisting with Redis
