$(document).ready(function() {

  // Initially, all the buttons except the join game ones are disabled
  $('#startGame').prop('disabled', true);
  $('#playCard').prop('disabled', true);
  $('#slap').prop('disabled', true);
  // $('#joinGame').prop('disabled', false);

  // Establish a connection with the server
  var socket = io();

  // Stores the current user
  var user = null;

  socket.on('connect', function() {
    console.log('Connected');
    if(localStorage.getItem("id")){

      socket.emit('username', {id: localStorage.getItem("id")})
    }
    // hide the loading container and show the main container
    $('.connecting-container').hide();
    $('.main-container').show();
  });

  socket.on('username', function(data) {
    // YOUR CODE HERE
    if(data ===false){
      localStorage.setItem('id', '');
      var username = window.prompt('Enter a usename');
      socket.emit('username', username);
      return
    }
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#startGame').prop('disabled', false);
    $('#usernameDisplay').text('Joined game as '+data.username);
    user = data;
    localStorage.setItem('id', data.id);

    // localStorage.setItem("cake", "strawberry");
  });

  socket.on('playCard', function(data) {
    // YOUR CODE HERE
    var cardstr = data.cardString.toLowerCase();
    var cardsrc = '/cards/'+cardstr.replace(/ /g,"_")+".svg";
    console.log(cardsrc);
    $('#card').attr("src", cardsrc);
  });

  socket.on('start', function() {
    // YOUR CODE HERE
    $('#startGame').prop('disabled', true);
    $('#playCard').prop('disabled',false);
    $('#slap').prop('disabled',false);
  });

  socket.on('message', function(data) {
    // YOUR CODE HERE
//     setTimeout(fade_out, 5000);
//
// function fade_out() {
//   $("#mydiv").fadeOut().empty();
// }
    $('#messages-container').append(data);
    setTimeout(function() {
      $('#messages-container').fadeOut().empty();
    }, 5000)
  });

  socket.on('clearDeck', function(){
    // YOUR CODE HERE
    $('#card').removeAttr("src");
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
    socket.emit('start');
  });

  $('#joinGame').on('click', function(e) {
    e.preventDefault();
    // YOUR CODE HERE
    // var username = window.prompt("Enter a usename");
    // socket.emit('username', username);

    if(!localStorage.getItem("id")){
      var username = window.prompt("Enter a usename");
      // localStorage.setItem("id", username);
      socket.emit('username', username);
    }else{
      socket.emit('username', {id: localStorage.getItem("id")});
    }
  });

  $('#observeGame').on('click', function(e) {
    e.preventDefault();
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#usernameDisplay').text('Observing game...');

    // YOUR CODE HERE
  });

  $('#playCard').on('click', function(e) {
    e.preventDefault();
    socket.emit('playCard');
    // YOUR CODE HERE
  });

  $('#slap').on('click', function(e) {
    e.preventDefault();
    // YOUR CODE HERE
    socket.emit('slap');
  });

});
