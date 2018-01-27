var socket = io();

function CardGraphic(x, y, code, serverOrder) {
    this.x = x;
    this.y = y;
    this.graphicSrc = "static/images/" + code + ".png";
    this.img = new Image();
    this.serverOrder = serverOrder
}

CardGraphic.prototype.draw = function(context) {
    var x = this.x;
    var y = this.y;
    this.img.onload = function() {
        context.drawImage(this.img, x, y, 100, 140);
    }
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
        var mouse = baseState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var graphics = baseState.graphics;
        var l = graphics.length;
        for (var i = l - 1; i >= 0; --i) {
            if (graphics[i].contains(mx, my)) {
                var sel = graphics[i];
                baseState.dragoffx = mx - sel.x;
                baseState.dragoffy = my - sel.y;
                baseState.dragging = true;
                baseState.selection = sel;
                baseState.selectionIdx = i;
                baseState.valid = false;
                return;
            }
        }
        if (baseState.selection) {
            baseState.selection = null;
            baseState.valid = false;
        }
    }, true);

    canvas.addEventListener('mousemove', function(e) {
        if (baseState.dragging) {
            var mouse = baseState.getMouse(e);
            baseState.selection.x = mouse.x - baseState.dragoffx;
            baseState.selection.y = mouse.y - baseState.dragoffy;
            baseState.valid = false;
        }
    }, true);

    canvas.addEventListener('mouseup', function(e) {
        if (baseState.dragging) {
            socket.emit('drag', {idx: baseState.selection.serverOrder, x: baseState.selection.x, y: baseState.selection.y})
        }
        baseState.dragging = false;
    }, true);

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


var canvas = document.getElementById('canvas');

canvas.width = 800;
canvas.height = 600;

canvasState = new CanvasState(canvas);

socket.on('cards', function(cards) {
    canvasState.reset();
    for (var i in cards) {
        var card = cards[i];
        canvasState.addGraphic(new CardGraphic(card.x, card.y, card.code, card.serverOrder));
    }
});

// [1] https://simonsarris.com/making-html5-canvas-useful/