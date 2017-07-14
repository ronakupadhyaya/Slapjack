$(document).ready(function() {

  // Initially, all the buttons except the join game ones are disabled
  $('#startGame').prop('disabled', true);
  $('#playCard').prop('disabled', true);
  $('#slap').prop('disabled', true);

  // Establish a connection with the server
  var socket = io();

  // Stores the current user
  var user = null;

  socket.on('connect', function() {
    console.log('Connected');

    // hide the loading container and show the main container
    $('.connecting-container').hide();
    $('.main-container').show();
  });

  socket.on('username', function(data) {
    // YOUR CODE HERE
    $('#observegame').prop('disabled', true);
    $('#joinGame').prop('disabled', true);
    $('#startgame').prop('enabled', true);
    $('#usernameDisplay').text('Joined game as ' + data.username);
    user = data
  });

  socket.on('playCard', function(data) {
    // YOUR CODE HERE
    $('img').attr('src', data.cardString.toLowerCase().split(' ').join('_')+".svg")
  });

  socket.on('start', function() {
    // YOUR CODE HERE
    $('#startGame').prop('disabled', true);
    $('#slap').prop('enabled', true);
    $('#playCard').prop('enabled', true);
  });

  socket.on('message', function(data) {
    // YOUR CODE HERE
    $('messages-container').append(data)
  });

  socket.on('clearDeck', function(){
    // YOUR CODE HERE
    $('img').attr('src', '')
  });

  socket.on("updateGame", function(gameState) {
    // If game has started, disable join buttons
    if (gameState.isStarted) {
      $('#joinGame').prop('disabled', true);
      $('#observeGame').prop('disabled', true);

      // If game has started and user is undefined, he or she must be an observer
      if (!user) {
        $('#usernameDisplay').text('Observing game...');
      }
    }

    // Displays the username and number of cards the player has
    if (user) {
      $("#usernameDisplay").text('Playing as ' + user.username);
      $(".numCards").text(gameState.numCards[user.id] || 0);
    }

    // Shows the players who are currently playing
    $(".playerNames").text(gameState.playersInGame);

    // Displays the current player
    if (gameState.isStarted) {
      $(".currentPlayerUsername").text(gameState.currentPlayerUsername + "'s turn");
    } else {
      $(".currentPlayerUsername").text('Game has not started yet.');
    }

    // Displays the number of cards in the game pile
    $("#pileDisplay").text(gameState.cardsInDeck + ' cards in pile');

    $(".num").show();

    // If the game is in a winning state, hide everything and show winning message
    if (gameState.win) {
      $('.main-container').hide();
      $('.connecting-container').text(gameState.win + ' has won the game!');
      $('.connecting-container').show();
    }
    window.state = gameState;
  })

  socket.on('disconnect', function() {
    // refresh on disconnect
    window.location = window.location;
  });

  // This handler is called when a player joins an already started game
  socket.on('observeOnly', function() {
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#usernameDisplay').text('Observing game...');
  })

  // A handler for error messages
  socket.on('errorMessage', function(data) {
    alert(data);
  })

  // ==========================================
  // Click handlers
  // ==========================================
  $('#startGame').on('click', function(e) {
    e.preventDefault();
    // YOUR CODE HERE
    socket.emit('start')
  });

  $('#joinGame').on('click', function(e) {
    e.preventDefault();
    // YOUR CODE HERE
    var username = prompt("Pick a username");
    socket.emit('username', username)

  });

  $('#observeGame').on('click', function(e) {
    e.preventDefault();
    // YOUR CODE HERE
    $('#observegame').prop('disabled', true);
    $('#joinGame').prop('disabled', true);
    $('#usernameDisplay').text('observing game...')
  });

  $('#playCard').on('click', function(e) {
    e.preventDefault();
    // YOUR CODE HERE
    socket.emit('playCard')
  });

  $('#slap').on('click', function(e) {
    e.preventDefault();
    // YOUR CODE HERE
    socket.emit('slap')
  });

});
