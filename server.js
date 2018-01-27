// Boilerplate
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function() {
    console.log('Starting server on port 5000');
});

io.on('connection', function(socket) {
    socket.emit('cards', cards);
    socket.on('drag', function(change) {
        cards[change.idx].x = change.x;
        cards[change.idx].y = change.y;
        io.sockets.emit('cards', cards);
    });
});

// Game logic
var cards = [];

function Card(code, x, y, theta, serverOrder) {
    this.code = code;
    this.x = x;
    this.y = y;
    this.theta = theta;
    this.serverOrder = serverOrder
}

function addDeck() {
    for (i = 0; i < 54; ++i) {
        cards.push(new Card(i, 50 + 2*i, 50 + 2*i, 0, i))
    }
}

addDeck();
