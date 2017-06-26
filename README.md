# Slapjack
Today, we'll be doing a fun project - implementing the multiplayer card game _Slapjack_ using WebSockets!

## Table of Contents

* **Rules of Slapjack** 🃏
* **Step 1:** Game Logic ♠️
* **Step 2:** Displaying Your Game ♥️
* **Step 3:** Persistence ♣️
* **Bonus:** Deploy, deploy, deploy! ♦️

## Rules of Slapjack 🃏
In Slapjack, the objective of the game is to have the entire deck of cards (52 cards).

At the beginning of a game of Slapjack, each player is dealt an equal number of cards facedown (players are not able to see their own cards or anyone else's cards).

> If the number of players does not divide 52, then a few players might get additional cards. For example, players in a 3-player game will have 17, 17, and 18 cards.

Players will then go in order, playing their cards to the pile until they reach 52 cards (_the winning condition of the game_) or have no more cards left to deal.

Players can gain cards by "slapping" the pile - in which case they either gain the pile or lose 3 cards based on the following conditions:

* If the top card of the pile is a Jack, the player gains the pile
* If the top two cards of the pile are of the same value (i.e., two Aces, two 10's, two 2's), the player gains the pile
* If the top card and third-to-top card are of the same value (sandwich - i.e. (Ace-10-Ace), (7-Queen-7)), the player gains the pile
* Otherwise, the player loses 3 cards on top of his or her pile to the **bottom** of the central pile

Additionally, only one person can slap a winning pile; all players slapping immediately after the first lose 3 cards.

## Step 1: Game Logic ♠️
We will isolate all of your Slapjack game's logic into a single module inside of `game.js`. We will also have `player.js` and `card.js` to help create necessary objects. Before you begin, make sure to run `npm install` to get all the dependencies you need to both start and test the application. In this step, you won't ever need to `npm start` - just run `npm test` when prompted to! In the next step, we'll be serving up the game to your connected users.

### Cards 🂥 - `card.js`

We should only have two properties and three functions for any given `Card` object:

* The `value` of the playing card, from 1-13 (where Ace is 1, Jack is 11, Queen is 12, King is 13).
* The `suit` of the playing card, which any one of the following: _hearts_, _spades_, _clubs_, or _diamonds_.
* A `toString` function that allows us to get the human-readable description for the card, i.e. _Ace of Spades_, _8 of Hearts_, etc.
* Two more persistence functions: `fromObject` and `toObject`. (We have already done this for you and we will look more into this at Step 3.)

Complete the `Card` constructor which initializes those two properties and create the `toString` function which returns the human-readable description for the card as a string.

> Test: At this point, run `npm test` to check your progress and verify that the tests for `card.js` are working!

### Player 🐥 - `player.js`

Next, build out your `Player` object - your `Player` object should have three properties and three functions:

* `username`.
* `id` - generated upon construction.
* `pile` - represented by an Array of `Card` objects.
* A `generateId` function that helps to generate random strings.
* Two more persistence functions: `fromObject` and `toObject`. (We have already done this for you and we will look more into this at Step 3.)

Complete the `Player` constructor which initializes those three properties stated above. You can use `this.generateId()` for `id`. Also, the `pile` should be an empty array initially.

> Test: At this point, run `npm test` to check your progress and verify that the tests for `player.js` are working!

### Game 🏅 - `game.js`

We want to create some basic properties for our `Game` object as well. Below is a brief explanation of each property you need to create and how we'll be using them:

* `isStarted` - A Boolean to check if the game is in progress or not. Initially, this will be `false`.
* `players` - An Object to store the `Player` objects by the key of an ID and value of a `Player` object. We should be able to access `Player`s from this object with `players[id]`.
* `playerOrder` - An Array of IDs of players, representing their order in the game. The current player will always be at index 0.

	```
	Initially, this.playerOrder is [0, 1, 2, 3]
	// After player 0 has played, the array becomes
	// [1, 2, 3, 0]
	// After player 1 has played, the array becomes
	// [2, 3, 0, 1]
	// After player 2 has played, the array becomes
	// [3, 0, 1, 2]
	// After player 3 has played, the array becomes
	// [0, 1, 2, 3]
	// and the cycle goes on...
	```

* `pile` - An Array of `Card` objects representing the central pile.

The `Game` class will also have 11 functions - 6 game-related functions, and 5 persistence-related functions. We have completed the persistence-related functions for you.

> **Test:** Feel free to run `npm test` anytime to check your progress and verify that your methods are working!

You have to complete 6 game-related functions:

* `addPlayer(username)` - for adding players into the game
	* should take a `username` as a String
	* Throw an error if the game has already started
		* **Hint:** `this.isStarted`
	* Throw an error if the username is empty
		* **Hint:** `trim()`
	* Throw an error if the player's username is non-unique
		* **Hint:** check `this.players`
	* If no error was thrown:
		* **create** a new `Player` object with a username
		* **push** the new player's ID into `this.playerOrder` Array
		* **add** the new `Player` to the `players` Object.
			* **Hint:** `this.players[player.id] = player`
		* **return** the ID of the new `Player`

* `startGame()` - begin game setup
	* Throw an error if the game has already started
		* **Hint:** `this.isStarted`
	* Throw an error if the game has fewer than two people added
		* **Hint:** `this.players`
	* If no error was thrown:
		* **set** `this.isStarted` to `true`
		* **create** a standard deck of 52 playing cards (4 suits x 13 values) and shuffle them
			* **Hint:** You may find Underscore's `.shuffle` method helpful for implementing a Fisher-Yates shuffle!
		* **distribute** the cards evenly to all players
			* **Hint:** If the number of players does not divide 52, then some players might get more cards.

* `nextPlayer()` - move the current player to the next player. i.e. rotate `this.playerOrder` array by one to the left
	* Throw an error if the game has **not** started yet
		* **Hint:** `this.isStarted`
	* If no error was thrown:
		* **shift** the array by one to the left until the player at index 0 has a non-zero pile of cards.

			* **Hint:** All players have at least one card

				```
				Initially, this.playerOrder is [0, 1, 2, 3]
				// After player 0 has played, the array becomes
				// [1, 2, 3, 0]
				// After player 1 has played, the array becomes
				// [2, 3, 0, 1]
				// After player 2 has played, the array becomes
				// [3, 0, 1, 2]
				// After player 3 has played, the array becomes
				// [0, 1, 2, 3]
				// and the cycle goes on...
				```
			* **Hint:** Player 2 and 3 have no cards left

				```
				Initially, this.playerOrder is [0, 1, 2, 3]
				// After player 0 has played, the array becomes
				// [1, 2, 3, 0]
				// After player 1 has played, the array becomes
				// [0, 1, 2, 3]
				// (since 2 and 3 have no cards)
				// and the cycle goes on...
				```

* `isWinning(playerId)` - should take a Player ID and return a boolean to determine whether or not the Player corresponding to that ID has won
	* Throw an error if the game has **not** started yet
		* **Hint:** `this.isStarted`
	* If no error was thrown:
		* Check for a winning condition of a Player corresponding to the `playerId` passed in and, if a win occurred, set `this.isStarted` to `false` and return true.
		* Otherwise, return `false` - the Player did not meet a winning condition.

* `playCard(playerId)` - should take a Player ID of the Player attempting to play a Card
	* Throw an error if the game has **not** started yet
		* **Hint:** `this.isStarted`
	* Throw an error if the current Player ID does not match the passed-in Player ID (this means a player is attempting to play a card out of turn)
		* **Hint:** `this.playerOrder[0]`
	* Throw an error if the Player corresponding to the passed-in Player ID has a pile length of zero
		* **Hint:** `this.players[playerId].pile.length`
	* If no error was thrown:
		* **move** the *top* card of a Player's pile onto the *top* card of the Game pile.
			* **Hint:** The top card of the Player's pile refers to the last element in `this.players[playerId].pile`. Same goes to the Game pile.
		* **count** the number of players with 0 cards
			* If the number of players with 0 cards equals to the total number of players (i.e. everyone has no more cards), **set** `isStarted` to false and **throw** an error.
		* **call** `this.nextPlayer()` to move the current player		* **return** an object with two keys `card` and `cardString`.
			* **Hint:** (newCard refers to the card that was just placed on the top of the Game pile)

				```
				{
				  card: newCard,
				  cardString: newCard.toString()
				}
				```

* `slap(playerId)` - should take a Player ID of the Player attempting to slap and return an Object (format described below)
	* Throw an error if the game has **not** started yet
		* **Hint:** `this.isStarted`
	* If no error was thrown:
		* Check for any of the winning slap conditions
			* If the top card of the pile is a **Jack**
			* If the top two cards of the pile are of the same **value**
			* If the top card and third-to-top card are of the same value (sandwich)
				* **Hint:**

					```
					var last = this.pile.length - 1;
	        		this.pile.length > 2 && this.pile[last].value === this.pile[last - 2].value
	        		```
		* If there is a winning slap condition, **move** the pile into the **back of the pile** of the Player corresponding to the passed-in Player ID, and **set** `this.pile` to `[]`
			* **Hint:**

				```
				this.players[playerId].pile = [...this.pile, ...this.players[playerId].pile];
				```
			* Return an object with the following key-value pairs:
				* `winning: this.isWinning(playerId)`
				* `message: 'got the pile!'`
		* Otherwise, take the **top** 3 cards (at most) from the pile of the Player corresponding to the passed-in Player ID and add it to the **bottom** of the game pile
			* If the player has less than 3 cards, take everything. (Hint: `Math.min(3, len)`)
			* Return an object with the following key-value pairs:
				* `winning: false`
        		* `message: 'lost 3 cards!'`

> **Test:** Feel free to run `npm test` anytime to check your progress and verify that your methods are working!

## Step 2: Displaying Your Game ♥️
Now that your game is setup and running, we are going to build out the front end of it so that your game doesn't just live in a variable on your Node server, but communicating with all connected clients and updating their views simultaneously.

### Sending WebSockets Events ☝️ - `app.js`
First, a little crash course on using the [socket.io](http://socket.io) library we are using to send and receive events between our clients and server with WebSockets:

All messages sent between client and server on WebSockets happens in terms of "events" that are emitted and received. On both the client and server, `emit` sends an event back _to_ the other, and `.on` creates a handler to receive an event _from_ the other. For example:

<sub>Client</sub>

```javascript
socket.emit("cake", "Here is some strawberry cake"); // 1
socket.on("cake", function(data) {
	// Alerts with "The server said thank you for cake"
	alert("The server said " + data); // 4
})
```
<sub>Server</sub>

```javascript
socket.on("cake", function(data) {
	console.log(data); // Logs "Here is some strawberry cake" // 2
	socket.emit("cake", "thank you for cake"); // 3
});
```

Super simple, and fast! **Note that `socket.emit` only emits to one connected socket at a time** (where each client is represented by a single socket).

To **broadcast an event** to all connected clients, call `socket.broadcast.emit` with the same parameters.

Below is a spec of the events that we want to emit back to the client and respond to from the client: use the scaffold to update game logic within these events and pass back to the client necessary game information.

#### Getting and Setting the Username

1. **Server Receive (`app.js`):** `connection` (when a client initially connects)
	* Immediately emit a `username` event back to the client with `false`

* **Client Receive (`views/index.js`):** `username`
	* If the data passed in is `false`, prompt (you can use `.prompt` to get input) the user for a username and save it. Then, emit a `username` event back with the saved username.
	* Otherwise, save the response. If the response is not `false`, it is your client's player's ID.

* **Server Receive (`app.js`):** `username` (receives String, username)
	* Attempt to add the user to the game
	* If the game throws an error, emit back `username` with `false`
	* Otherwise, set `socket.playerId` equal to the new ID of the player and emit back `username` with the new ID (received back from `addPlayer`)

#### Starting the Game
1. **Server Receive (`app.js`):** `start`
	* Attempt to start the game
	* If the game throws an error, emit back `message` with "Cannot start game yet!"
	* Otherwise, emit a `start` event and broadcast a `start` event to all clients

* **Client Receive (`views/index.js`):** `start`
	* Disable your Start Game button (_hint: you have jQuery!_)

#### Playing the Cards Right
1. **Server Receive (`app.js`):** `playCard`
	* Attempt to call `playCard` with `socket.playerId` (which you set earlier on the `username` event)
	* If the game throws an error, emit back `message` with "Not your turn yet!"
	* Otherwise, emit a `playCard` event and broadcast a `playCard` event with the return result of `game.playCard` (the new Card just played).

* **Client Receive (`views/index.js`):** `playCard` (receives a String representation of the Card just played)
	* Update your view to display a card - you will be only showing one card in the pile at a time.
	* **Note:** We have placed some nice, open-source SVG graphics of cards named like `10_of_spades.svg`, `ace_of_hearts.svg`, etc. Update the `src` of an `<img>` element! - perhaps with the data you receive from a `playCard` event? Think about how you will turn "King of hearts" to simply "king_of_hearts.svg"!

#### Slap!
* **Server Receive (`app.js`):** `slap`
	* Attempt to call `slap` with `socket.playerId` (which you set earlier on the `username` event)
	* If the game throws an error, emit back `message` with the error (note: a failed slap does not throw an error!)
	* Otherwise, emit a `slap` event with the return result of `game.slap` and broadcast a `message` event with "_their username_ just " + `[*return result game.slap*].message`, i.e. "Ethan just lost 3 cards!" or "Ethan just won the pile!"
		* **Note:** if the return result of `game.slap` is `true`, broadcast a `message` event with "_their username_ just won the game!"


* **Client Receive (`views/index.js`):** `slap`
	* If the `response.winning` property is `true`, display a message saying that you won!
	* Otherwise, display a temporary message on the screen with the data received (from the `response.message`) for 5 seconds - if using jQuery, select the element and call `fadeOut` on it
		* This message will be either "lost 3 cards!" or "won the pile!" - since you are the only one handling this event, you can append "You" to the message to make it "You lost 3 cards!" or "You won the pile!"


#### Getting Messages
* **Client Receive (`views/index.js`):** `message`
	* Display a temporary message on the screen with the data received for 5 seconds - if using jQuery, select the element and call `fadeOut` on it.

#### Updating Other Game State Properties

First you will need to create a function at the beginning of your `app.js` file, after you define the `new Game()` called `getGameStatus()`. This should return an object with the fields below:

- `numCards`: an Object with the keys as playerIds and the value as the number of Cards
- `currentPlayerUsername`: the username of the current players name
- `playersInGame`: A string with the name of all the players in the game
- `cardsInDeck`: How many cards are in the current pile

Next you will need to emit this information to the client by creating a new event called `updateGame`. `updateGame` will  back the above information to all clients so that each player is looking at the game in the same state.

* **Server Send (`views/index.js`):** `updateGame`
	* Upon important user actions, such as `username` (a new Player entering the game), `playCard` (a Card being played by a user), and `slap` (any time a Player attempts a slap), we want to emit this event with the return result of `getGameStatus()`.
	* Both emit and broadcast `updateGame` after these user actions so that all connected clients receive an up-to-date game state.

* **Client Receive (`views/index.js`):** `updateGame`
	* When receiving an `updateGame` event, you will use the information you received, to then populate the game state fields in html. Below is sample code of a helper function that takes  `state` passed from the received `updateGame` event and updates the content of the page accordingly.

	```javascript
	function updateGameStatus(state){
		$(".username").text(username);
		$(".numCards").text(state.numCards[id]);
		$(".playerNames").text(state.playersInGame);
		$(".currentPlayerUsername").text(state.currentPlayerUsername);
		$(".cardsInDeck").text(state.cardsInDeck);
		$(".num").show();
		window.state = state;
	}
	```

## Step 3: Persistence ♣️

### Implementing Sessions

#### Persisting the ID for the Client - `views/index.hbs`
You may have noticed during testing that every time you refreshed your browser while the server was running, it would prompt you for another username, not allowing you to jump back into the game as the same user you played with before. We will implement a simple form of sessions using unique IDs.

We will store unique IDs in `LocalStorage`. [`LocalStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) is a mechanism for storing key-value pairs in the browser on a per-website basis. When we get back a unique User ID from the server with the `username` event, we will store it in `LocalStorage` rather than in a variable. To set something with a browser's `LocalStorage` looks like the following:

```javascript
localStorage.setItem("cake", "strawberry"); // first parameter is key, second parameter is value
```

Getting an item back from `LocalStorage` is very similar; just change the name of the method to `getItem` and pass in a key:

```javascript
var cake = localStorage.getItem("cake"); // variable cake is now "strawberry"
```

Note that if `getItem` is called with a key that is not defined or found in `LocalStorage`, it will return null. Thus, rather than initially setting our ID variable of the user playing to an empty string, we want something along the lines of:

```javascript
var id = localStorage.getItem("id") || "";
```

Here, if `LocalStorage` does not have our item, `id` will be set to empty string.

Wrap your existing `.on` event handler for a received `username` event into a conditional that checks if `localStorage.getItem("id")` is null - this means that the user has not played yet and we need to prompt for a username. Additionally, when we initially get an ID back from the `username` event now, **we want to make sure that we are saving it** to `LocalStorage` with `setItem`.

In the case where `localStorage.getItem("id")` is non-null, on the other hand, we need to send an event back to the server presenting an ID of a currently playing user. To make the distinction between a new player and an existing player attempting to re-join, we will emit a `username` event with an Object formatted like the following to the server:

`{ id: "XXXXXXXXX" }`

We'll deal with re-associating the new `socket` connection with the existing player in the next section.

#### Re-setting the ID on the Server - `app.js`

Modify the `username` event handler on the server to check if we are receiving a String (in which case, a new user is attempting to join the game) or if we are receiving an Object with an ID (in which case, an existing user is re-joining the game).

Your new `username` event halder should:

1. If the data received is a String, do the same thing as before.
2. Otherwise, if the `data` we receive is an Object, set `socket.playerId` to `data.id`. Now, additional calls to `slap` or `playCard` will be using the correct Player ID. Finally, send (i.e. emit) back `start` and `updateGame` events to initialize the game state of the player who is re-joining.


### Implementing Persistence

Go to the bottom of your `game.js` file and take a look at the persistence functions we have built in for you. Determine where you need to call `this.persist()` in your game to save the game state!


 **Bonus:** Deploy, deploy, deploy!
 before we deploy, we need to implement the reset button...
 in a way that will allow us to deploy to Heroku and play with your friends.

