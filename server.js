// Boilerplate
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 8080);
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(8080, function() {
    console.log('Starting server on port 8080');
});

var players = [];
var playerNums = [];
io.on('connection', function(socket) {;
    for (i = 1;; ++i) {
        if (!playerNums.includes(i)) {
            playerNums.push(i);
            players.push({id: socket.id, num:playerNums.slice(-1)[0]})
            break;
        }
    }
    socket.emit('playerinfo', {players: playerNums, num: playerNums.slice(-1)[0]});
    socket.emit('cards', cards);
    
    socket.on('update', function(change) {
        for (i in cards) {
            if (cards[i].cardID == change.cardID) {
                
                cards[i].x = change.x || cards[i].x;
                cards[i].y = change.y || cards[i].y;
                cards[i].visible = change.visible || cards[i].visible;
                cards.push(cards.splice(i, 1)[0]);
            }
        }
        io.sockets.emit('cards', cards);
    });

    socket.on('deck', function() {
        addDeck();
        socket.emit('cards', cards);
    });

    socket.on('shuffle', function() {
        cards = shuffle(cards);
        socket.emit('cards', cards);
    });

    socket.on('hide-all', function() {
        for (var i in cards) {
            cards[i].visible = [];
        }
        socket.emit('cards', cards);
    });

    socket.on('clear-all', function() {
        cards = [];
        socket.emit('cards', cards);
    });

    socket.on('collect', function() {
        for (var i in cards) {
            cards[i].x = 0;
            cards[i].y = 0;
        }
        socket.emit('cards', cards);
    });

    socket.on('disconnect', function() {
        for (var i in players) {
            if (players[i].id == socket.id) {
                playerNums.splice(playerNums.indexOf(players.splice(i, 1)[0].num), 1);
                break;
            }
        }
    });
});

var cards = [];

function Card(code, x, y, theta, cardID) {
    this.code = code;
    this.x = x;
    this.y = y;
    this.theta = theta;
    this.cardID = cardID
    this.visible = "all";
}

function addDeck() {
    var l = cards.length;
    for (i = 0; i < 54; ++i) {
        cards.push(new Card(i, 50 + 2*i, 50 + 2*i, 0, i + l))
    }
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

function addShuffledDeck() {
    var l = cards.length;
    var cs = [];
    for (i = 0; i < 54; ++i) {
        cs.push(new Card(i, 50 + 2*i, 50 +2*i, 0, i + l));
    }
    cs = shuffle(cs);
    for (var i in cs) {
        cards.push(cs[i]);
    }
}
