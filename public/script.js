$(document).ready(function() {

  $('#startGame').prop('disabled', true);
  $('#playCard').prop('disabled', true);
  $('#slap').prop('disabled', true);

  var socket = io();
  var type = ''; // player or observer
  var user = null;

  socket.on('connect', function() {
    console.log('Connected');
    $('.connecting-container').hide();
    $('.main-container').show();
  });

  socket.on('username', function(data) {
    if (data === false) {
      console.log('reset?')
      localStorage.setItem('id', '');
      join('player');
      return;
    }
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#usernameDisplay').text('Joined game as ' + data.username);
    $('#startGame').prop('disabled', false);
    user = data;
    console.log(data);
    localStorage.setItem('id', data.id);
  });

  socket.on('playCard', function(data) {
    var imgsrc = data.cardString.toLowerCase().split(" ").join("_") + ".svg";
    $("#card").attr("src", "/cards/" + imgsrc);
  });

  socket.on('start', function() {
    $('#startGame').prop('disabled', true);
    $('#playCard').prop('disabled', false);
    $('#slap').prop('disabled', false);
  });

  socket.on('message', function(data) {
    var message = $("<h3>" + data + "</h3>");
    $("#messages-container").append(message);

    setTimeout(function() {
      message.fadeOut();
    }, 5000);
  });

  socket.on('clearDeck', function(){
    $("#card").attr("src", "");
  });

  socket.on("updateGame", function(gameState) {
    if (gameState.isStarted) {
      $('#joinGame').prop('disabled', true);
      $('#observeGame').prop('disabled', true);
      if (!user) {
        $('#usernameDisplay').text('Observing game...');
      }
    }
    if (user) {
      $("#usernameDisplay").text('Playing as ' + user.username);
      $(".numCards").text(gameState.numCards[user.id] || 0);
    }
    $(".playerNames").text(gameState.playersInGame);
    if (gameState.isStarted) {
      $(".currentPlayerUsername").text(gameState.currentPlayerUsername + "'s turn");
    } else {
      $(".currentPlayerUsername").text('Game has not started yet.');
    }
    $("#pileDisplay").text(gameState.cardsInDeck + ' cards in pile');
    $(".num").show();
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

  socket.on('observeOnly', function() {
    $('#joinGame').prop('disabled', true);
    $('#observeGame').prop('disabled', true);
    $('#usernameDisplay').text('Observing game...');
  })

  socket.on('errorMessage', function(data) {
    alert(data);
  })

  $('#startGame').on('click', function(e) {
    e.preventDefault();
    socket.emit('start');
  });

  $('#joinGame').on('click', function(e) {
    e.preventDefault();
    join('player');
  });

  $('#observeGame').on('click', function(e) {
    e.preventDefault();
    join('observer');
  });

  $('#playCard').on('click', function(e) {
    e.preventDefault();
    socket.emit('playCard');
  });

  $('#slap').on('click', function(e) {
    e.preventDefault();
    socket.emit('slap');
  });

  function join(data) {
    type = data;
    if (type === 'player') {
      var id = localStorage.getItem('id') || '';
      if (id === '') {
        var name = prompt('Enter your username:');
        socket.emit('username', name);
      } else {
        socket.emit('username', { id: id });
      }
    } else { // observer
      $('#joinGame').prop('disabled', true);
      $('#observeGame').prop('disabled', true);
      $('#usernameDisplay').text('Observing game...');
    }
  }
});
