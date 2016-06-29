# Slapjack
Today, we'll be doing a fun project - implementing the multiplayer card game _Slapjack_ in a way that will allow us to deploy to Heroku and play with your friends. 

## Table of Contents

* **Rules of Slapjack**
* **Step 1:** Game Logic
* **Step 2:** Displaying Your Game
* **Step 3:** Deploying to Heroku

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
### Cards and Players - `game.js`

### Game Starter - `game.js`

### Gameplay Functions - `game.js`


## Step 2: Displaying Your Game

### WebSockets Events - `views/index.hbs`

### Displaying Cards - `views/index.hbs`


## Step 3: Deploying to Heroku