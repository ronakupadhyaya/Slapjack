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
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#startGame').prop('disabled', false);
    $('#usernameDisplay').text('Joined game as '+data.username);
    if (data === false) {
      localStorage.setItem('id', ''); // reset the id in localStorage

      // var defaultUsername = "player"+Math.round(Math.random()*100);
      // var username = window.prompt('Enter a username: ', defaultUsername);
      // console.log('REACHED repetitive SCRIPT: unknown user');
      // socket.emit('username', username);

      return;
    } else {
      user = data;
    }
  });
  //receive playCard event: data is a obj w/ card and cardString
  socket.on('playCard', function(data) {
    var imgSrc = data.cardString.toLowerCase().split(" ").join("_") + ".svg";
    console.log('IMAGE: ', imgSrc);
    $('#card').attr("src", "./cards/"+imgSrc);
  });
  //receive start: start game, disable some buttons
  socket.on('start', function() {
    $('#startGame').prop('disabled', true);
    $('#playCard').prop('disabled', false);
    $('#slap').prop('disabled', false);
  });
  //receive message: data is message
  socket.on('message', function(data) {
    $('#messages-container').append( `
      <h3 id="message_elem">${data}</h3>`);
    setTimeout(function() {
      $('#message_elem').remove();
    }, 5000);
  });
  //clear deck by remove image of card
  socket.on('clearDeck', function(){
    $('#card').attr("src", "");
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
      console.log("1: ",gameState," 2: ", gameState.numCards);
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
  //join game: check if already user, prompt for username if not
  $('#joinGame').on('click', function(e) {
    e.preventDefault();
    var id = localStorage.getItem("id");
    if (!id) {
      var defaultUsername = "player"+Math.round(Math.random()*100);
      var username = window.prompt('Enter a username: ', defaultUsername);
      console.log('REACHED JOIN GAME SCRIPT: unknown user');
      socket.emit('username', username);
    } else {
      console.log('REACHED JOIN GAME SCRIPT: known user');
      socket.emit('username', {id: id});
    }

  });

  $('#observeGame').on('click', function(e) {
    e.preventDefault();
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#usernameDisplay').text('Observing game ...');
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
