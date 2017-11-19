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
    if(data===false){
      localStorage.setItem('id','');
      var username = window.prompt("Please enter a new username.");
      socket.emit('username',username);
      return;
    }
    else{
      $('#joinGame').prop('disabled', true);
      $('#observeGame').prop('disabled', true);
      $('#startGame').prop('disabled', false);
      $('#usernameDisplay').text(`Joined game as ${data.username}`);
      localStorage.setItem("id",data.id);
      user = data;
    }
  });

  socket.on('playCard', function(card) {
    var cardString = card.cardString;
    var newString = '';
    var valString = cardString.split(' ');
    valString = valString[0];
    valString = valString.toLowerCase();
    var src = `/cards/${valString}_of_${card.card.suit}.svg`;
    $('#card').attr('src',src);
  });

  socket.on('start', function() {
    $('#playCard').prop('disabled', false);
    $('#slap').prop('disabled', false);
    $('#startGame').prop('disabled', true);
  });

  socket.on('message', function(message) {
    $('#messages-container').html(`<p>${message}</p>`);
    var fadeout = function(){
      $('#messages-container').html('');
    }
    setTimeout(fadeout,5000);
  });

  socket.on('clearDeck', function(){
    $('#card').attr('src','');
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
    socket.emit('start');
  });

  $('#joinGame').on('click', function(e) {
    e.preventDefault();
    var localId = localStorage.getItem('id') || "";
    //console.log('Local Id:',localId);
    if(localId === ""){
      var username = window.prompt("Please enter a new username.");
      socket.emit('username',username);
    }
    else{
      socket.emit('username',{id: localId});
    }
  });

  $('#observeGame').on('click', function(e) {
    e.preventDefault();
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
