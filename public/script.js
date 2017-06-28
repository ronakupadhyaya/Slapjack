$(document).ready(function() {
  console.log('refreshing page');
  // Initially, all the buttons except the join game ones are disabled
  $('#startGame').prop('disabled', true);
  $('#playCard').prop('disabled', true);
  $('#slap').prop('disabled', true);
  //
  $('#joinGame').prop('disabled', false);
  $('#observeGame').prop('disabled', false);
  console.log('prop stuff');

  // Establish a connection with the server
  var socket = io();

  // Stores the current user
  var user = null;

  socket.on('connect', function() {
    console.log('Connected');

    // hide the loading container and show the main container
    $('.connecting-container').hide();
    $('.main-container').show();
    // buttons
    $('#joinGame').prop('disabled', false);
    $('#observeGame').prop('disabled', false);
  });

  socket.on('username', function(data) {
    console.log('line 27');
    if(data === false){
      localStorage.setItem('id', '');
      var usernamePrompt = window.prompt('Please enter your username: ');
      socket.emit('username', usernamePrompt);
      return;
    }
    //disable buttons
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    // enable buttons
    if(!localStorage.getItem('id')){
        $('#startGame').prop('disabled', false);
    }else{
      $('#playCard').prop('disabled', false);
      $('#slap').prop('disabled', false);
    }

    // display
    $('#usernameDisplay').text('Joined game as ' + data.username);
    // update global variable
    user = data;

    localStorage.setItem('id', data.id);
  });

  socket.on('playCard', function(data) {
    // YOUR CODE HERE Jack of Spades -> jack_of_spades.svg
    var name = './cards/' + data.cardString.toLowerCase().split(' ').join('_') + '.svg';
    $('#card').attr('src', name);
  });

  socket.on('start', function() {
    // buttons
    $('#startGame').prop('disabled', true);
    $('#playCard').prop('disabled', false);
    $('#slap').prop('disabled', false);
    console.log('on start');
  });

  socket.on('message', function(data) {
    // YOUR CODE HERE
    $('#message-container').append(data);
    setTimeout(function(){
      $('#message-container').empty();
    }, 5*1000);
  });

  socket.on('clearDeck', function(){
    // YOUR CODE HERE
    $('#card').attr('src', '');
  });

  socket.on("updateGame", function(gameState) {
    // If game has started, disable join buttons
    if (gameState.isStarted) {
      $('#joinGame').prop('disabled', true);
      $('#observeGame').prop('disabled', true);
      console.log('on updateGame');
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
    if(!localStorage.getItem('id')){
      $('#joinGame').prop('disabled', true);
      $('#observeGame').prop('disabled', true);
      $('#usernameDisplay').text('Observing game...');
    }
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
    socket.emit('start');
  });

  $('#joinGame').on('click', function(e) {
    e.preventDefault();
    // check if user exists
    if(!localStorage.getItem("id")){
      var usernamePrompt = window.prompt('Please enter your username: ');
      socket.emit('username', usernamePrompt);
    }else{
      // re-login
      socket.emit('username', {id: localStorage.getItem("id")});
    }
  });

  $('#observeGame').on('click', function(e) {
    e.preventDefault();
    // disable buttons
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#usernameDisplay').text('Observing game...');
  });

  $('#playCard').on('click', function(e) {
    e.preventDefault();
    socket.emit('playCard');
  });

  $('#slap').on('click', function(e) {
    e.preventDefault();
    socket.emit('slap');
  });

});
