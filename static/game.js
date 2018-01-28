var socket = io({transports: ['websocket'], upgrade: false});
var canvas = document.getElementById('canvas');
var mouse;
var playerNum;

canvas.width = 800;
canvas.height = 600;

canvasState = new CanvasState(canvas);  

socket.on('playerinfo', function(info) {
    playerNum = info.num;
    document.getElementById("intro").innerHTML = "You are player " + info.num + ". The players are " + info.players + ".";
});

socket.on('cards', function(cards) {
    canvasState.reset();
    for (var i in cards) {
        var card = cards[i];
        canvasState.addGraphic(new CardGraphic(card.x, card.y, card.code, card.cardID, card.visible));
    }
    canvasState.draw();
});

function CardGraphic(x, y, code, cardID, visible) {
    this.x = x;
    this.y = y;
    this.cardID = cardID;
    this.visible = visible;
    if (visible != 'all' && !(this.visible.includes(playerNum))) {
        code = 54;
    }
    this.graphicSrc = "static/images/" + code + ".png";
    this.img = new Image();
    
}

CardGraphic.prototype.draw = function(context) {
    var x = this.x;
    var y = this.y;
    var img = this.img;
    this.img.src = this.graphicSrc;
    context.drawImage(this.img, x, y, 100, 140);
}

CardGraphic.prototype.contains = function(mx, my) {
    return  (this.x <= mx) && (this.x + 100 >= mx) &&
            (this.y <= my) && (this.y + 140 >= my);
}

function CanvasState(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.context = canvas.getContext('2d');

    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
        this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
        this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
        this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
    }
 
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop; 
    this.htmlLeft = html.offsetLeft;

    this.valid = false;
    this.graphics = [];
    this.dragging = false;
    this.selection = null;
    this.dragoffx = 0;
    this.dragoffy = 0;

    var baseState = this;

    canvas.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    }, false);

    canvas.addEventListener('mousedown', function(e) {
        mouse = baseState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var graphics = baseState.graphics;
        var l = graphics.length;
        for (var i = l - 1; i >= 0; --i) {
            if (graphics[i].contains(mx, my) && e.button != 2) {
                var sel = graphics.splice(i, 1)[0];
                graphics.push(sel);
                baseState.dragoffx = mx - sel.x;
                baseState.dragoffy = my - sel.y;
                baseState.dragging = true;
                baseState.selection = sel;
                baseState.valid = false;
                return;
            } else if (graphics[i].contains(mx, my) && e.button == 2) {
                socket.emit('update', {cardID: graphics[i].cardID, visible: (graphics[i].visible == 'all') ? [] : 'all'});
                return;
            }
        }
        if (baseState.selection) {
            baseState.selection = null;
            baseState.valid = false;
        }
    }, true);

    canvas.addEventListener('mousemove', function(e) {
        mouse = baseState.getMouse(e);
        if (baseState.dragging) {
            baseState.selection.x = mouse.x - baseState.dragoffx;
            baseState.selection.y = mouse.y - baseState.dragoffy;
            baseState.valid = false;
        }
    }, true);

    canvas.addEventListener('mouseup', function(e) {
        if (baseState.dragging) {
            socket.emit('update', {cardID: baseState.selection.cardID, x: baseState.selection.x, y: baseState.selection.y})
        }
        baseState.dragging = false;
    }, true);

    document.addEventListener('keypress', function(e) {
        var mx = mouse.x;
        var my = mouse.y;
        var graphics = baseState.graphics;
        var l = graphics.length;
        for (var i = l - 1; i >= 0; --i) {
            if (graphics[i].contains(mx, my)) {
                if (graphics[i].visible.length == 0 && e.key == playerNum) {
                    socket.emit('update', {cardID: graphics[i].cardID, visible: [playerNum]});
                } else if (graphics[i].visible != 'all' && graphics[i].visible[0] == playerNum) {
                    if (graphics[i].visible.includes(e.key)) {
                        socket.emit('update', {cardID: graphics[i].cardID, visible: graphics[i].visible.filter(x => x != e.key)});
                    } else {
                        graphics[i].visible.push(parseInt(e.key));
                        socket.emit('update', {cardID: graphics[i].cardID, visible: graphics[i].visible});
                    }
                }
            }
        }
    });

    this.selectionColor = '#CC00000';
    this.selectionWidth = 4;
    this.fps = 60;
    setInterval(function() {
        baseState.draw();
    }, 1000/this.fps);
 }

CanvasState.prototype.clear = function() {
    this.context.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
    if (!this.valid) {
        var context = this.context;
        var graphics = this.graphics;
        this.clear();
        
        context.fillStyle = "#5BC236";
        context.fillRect(0, 0, 800, 600);
        

        for (var i in graphics) {
            var graphic = graphics[i];
            graphic.draw(context);
        }

        if (this.selection != null) {

            context.strokeStyle = this.selectionColor;
            context.lineWidth = this.selectionWidth;
            var sel = this.selection;
            context.strokeRect(sel.x, sel.y, 100, 140);
        }

        this.valid = true;
    }
}

CanvasState.prototype.addGraphic = function(graphic) {
    this.graphics.push(graphic);
    this.valid = false;
}

CanvasState.prototype.reset = function() {
    this.graphics = [];
    this.valid = false;
}

CanvasState.prototype.getMouse = function(e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }

    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;
  
    return {x: mx, y: my};
}

var button = document.getElementById("add-deck");
button.addEventListener('click', function() {
    socket.emit('deck');
}, false);

var rbutton = document.getElementById("shuffle");
rbutton.addEventListener('click', function() {
    socket.emit('shuffle');
}, false);

var rrbutton = document.getElementById("hide-all");
rrbutton.addEventListener('click', function() {
    socket.emit('hide-all');
}, false);

var rrrbutton = document.getElementById("clear-all");
rrrbutton.addEventListener('click', function() {
    socket.emit('clear-all');
}, false);

var rrrrbutton = document.getElementById("collect");
rrrrbutton.addEventListener('click', function() {
    socket.emit('collect');
}, false);

// [1] https://simonsarris.com/making-html5-canvas-useful/