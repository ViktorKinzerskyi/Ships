"use strict";
// exports.__esModule = true;
// var PIXI = require("pixi.js");
// var TWEEN = require("../tween.js");
var app = new PIXI.Application({
    width: 800,
    height: 425
});
document.body.appendChild(app.view);
var yellowColor = 0xf8fc03;
var blueColor = 0x0384fc;
var redColor = 0xfc0703;
var greenColor = 0x3dfc03;
var outQueue = [];
var piers = [];
var ships = [];
var gateQueue = [
    true,
    true,
    true,
    true,
    true
];
var gateClosed = false;
var moveFromPort = false;
var moveToPort = false;
var spawnInterval = 8000;
Start();
function Start() {
    initSea();
    initPiers();
    startAction();
    initGate();
}
function initPiers() {
    for (var i = 0; i < 4; i++) {
        piers[i] = {
            id: i,
            cargo: drawObject(10, 10 + 105 * i, 40, 90, blueColor),
            pier: drawObject(10, 10 + 105 * i, 40, 90, yellowColor, yellowColor, 10),
            isBusy: false,
            isEmpty: true,
            coords: {
                x: [165, 60],
                y: [35 + 105 * i, 35 + 105 * i]
            }
        };
        app.stage.addChild(piers[i].pier);
        app.stage.addChild(piers[i].cargo);
    }
}
function drawObject(x, y, width, height, color, lineColor, lineWidth) {
    var shape = new PIXI.Graphics();
    if (lineColor)
        shape.lineStyle(lineWidth, lineColor);
    shape.beginFill(color);
    shape.drawRect(x, y, width, height);
    shape.endFill();
    return shape;
}
function initGate() {
    setInterval(function () {
        var currentShip = null;
        gateQueue.forEach(function (isFree, queueIndex) {
            if (!currentShip && !isFree) {
                ships.forEach(function (ship) {
                    if (ship.queuePos === queueIndex) {
                        currentShip = ship;
                    }
                });
                var rightPier = getRightPier(currentShip);
                if (rightPier) {
                    currentShip.toPier = rightPier;
                    if (!gateClosed && !moveFromPort) {
                        goToPier(currentShip, rightPier);
                        shiftAllShips();
                    }
                }
                else {
                    currentShip = null;
                }
            }
        });
    }, 500);
}
function shiftAllShips() {
    ships.forEach(function (ship) {
        if (ship && ship.queuePos && ship.queuePos !== 0 && gateQueue[ship.queuePos - 1]) {
            gateQueue[ship.queuePos] = true;
            gateQueue[ship.queuePos - 1] = false;
            ship.queuePos -= 1;
            goToNextQueue(ship);
        }
    });
}
function UnLoadShip(ship, pier) {
    new TWEEN.Tween(ship.cargo)
        .to({ width: 0 })
        .duration(5000)
        .onComplete(function () {
        if (!moveToPort) {
            goOut(ship, pier);
        }
        else {
            outQueue.push(ship);
        }
    })
        .start();
}
function LoadShip(ship, pier) {
    new TWEEN.Tween(ship.cargo)
        .to({ width: 90 })
        .duration(5000)
        .onComplete(function () {
        if (!moveToPort) {
            goOut(ship, pier);
        }
        else {
            outQueue.push(ship);
        }
    })
        .start();
}
function LoadPier(pier) {
    new TWEEN.Tween(pier.cargo)
        .to({ width: 0, x: 10 })
        .duration(5000)
        .onComplete(function () {
        pier.isEmpty = false;
    })
        .start();
}
function UnLoadPier(pier) {
    new TWEEN.Tween(pier.cargo)
        .to({ width: 40, x: 0 })
        .duration(5000)
        .onComplete(function () {
        pier.isEmpty = true;
    })
        .start();
}
function goOut(ship, pier) {
    moveFromPort = true;
    gateClosed = true;
    var outCoord;
    if (pier.id === 2) {
        outCoord = {
            x: [165, 280],
            y: [ship.ship.getBounds().y, 247]
        };
    }
    else {
        outCoord = {
            x: [165, 165, 280],
            y: [ship.ship.getBounds().y, 247, 247]
        };
    }
    new TWEEN.Tween(ship.ship)
        .to({ x: outCoord.x, y: outCoord.y })
        .duration(4000)
        .interpolation(TWEEN.Interpolation.Linear)
        .start();
    new TWEEN.Tween(ship.cargo)
        .to({ x: outCoord.x, y: outCoord.y })
        .duration(4000)
        .interpolation(TWEEN.Interpolation.Linear)
        .onComplete(function () {
        gateClosed = false;
        pier.isBusy = false;
        moveFromPort = false;
        goFarAway(ship);
    })
        .start();
    outCoord = null;
}
function goFarAway(ship) {
    var y = getRndOut();
    new TWEEN.Tween(ship.ship)
        .to({ x: 805, y: y })
        .duration(4000)
        .onComplete(function () {
        ships.forEach(function (ship, index) {
            if (ship.toDelte)
                ships.splice(index, 1);
        });
    })
        .start();
    ship.sheepTween = new TWEEN.Tween(ship.cargo)
        .to({ x: 805, y: y })
        .duration(4000)
        .start();
}
function goToPier(ship, pier) {
    moveToPort = true;
    gateQueue[ship.queuePos] = true;
    ship.toDelte = true;
    gateClosed = true;
    pier.isBusy = true;
    var coords;
    var x = ship.ship.getBounds().x;
    var duration = 1000;
    if (ship.queuePos === 0) {
        coords = {
            x: [x],
            y: [192]
        };
    }
    else if (ship.queuePos === 1) {
        coords = {
            x: [x, x - 100],
            y: [192, 192]
        };
        duration *= 2;
    }
    else if (ship.queuePos === 2) {
        coords = {
            x: [x, x - 100, x - 200],
            y: [192, 192, 192]
        };
        duration *= 3;
    }
    else if (ship.queuePos === 3) {
        coords = {
            x: [x, x - 100, x - 200, x - 300],
            y: [192, 192, 192, 192]
        };
        duration *= 4;
    }
    else if (ship.queuePos === 4) {
        coords = {
            x: [x, x - 100, x - 200, x - 300, x - 400],
            y: [192, 192, 192, 192, 192]
        };
        duration *= 5;
    }
    if (pier.id === 0) {
        coords.x.push(165, 165);
        coords.y.push(192, 111);
        duration += 1000 * 4;
    }
    else if (pier.id === 1) {
        coords.x.push(165);
        coords.y.push(192);
        duration += 1000 * 2;
    }
    else if (pier.id === 2) {
        coords.x.push(165);
        coords.y.push(192);
        duration += 1000 * 2;
    }
    else if (pier.id === 3) {
        coords.x.push(165, 165);
        coords.y.push(192, 273);
        duration += 1000 * 4;
    }
    pier.coords.x.forEach(function (x) {
        coords.x.push(x);
    });
    pier.coords.y.forEach(function (y) {
        coords.y.push(y);
    });
    ship.queuePos = null;
    new TWEEN.Tween(ship.ship)
        .to({ x: coords.x, y: coords.y })
        .duration(duration)
        .interpolation(TWEEN.Interpolation.Linear)
        .start();
    new TWEEN.Tween(ship.cargo)
        .to({ x: coords.x, y: coords.y })
        .duration(duration)
        .interpolation(TWEEN.Interpolation.Linear)
        .onComplete(function () {
        gateClosed = false;
        startPierLoading(pier, ship);
        moveToPort = false;
        outQueue.forEach(function (ship, index) {
            goOut(ship, ship.toPier);
            outQueue.splice(index, 1);
        });
    })
        .start();
    coords = null;
}
function startPierLoading(pier, ship) {
    if (pier.isEmpty) {
        LoadPier(pier);
        UnLoadShip(ship, pier);
    }
    else {
        UnLoadPier(pier);
        LoadShip(ship, pier);
    }
}
function getRightPier(ship) {
    var correctPier = null;
    piers.forEach(function (pier) {
        if (!pier.isBusy && pier.isEmpty === !ship.isEmpty) {
            correctPier = pier;
        }
    });
    return correctPier;
}
function initSea() {
    var seaTexture = PIXI.Texture.from('images/sea.jpg');
    var seaBackground = new PIXI.Sprite(seaTexture);
    seaBackground.x = 0;
    seaBackground.y = 0;
    seaBackground.width = 800;
    seaBackground.height = 425;
    app.stage.addChild(seaBackground);
    function portBorder(x, y, app) {
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xf8fc03);
        graphics.drawRect(x, y, 10, 128);
        graphics.endFill();
        app.stage.addChild(graphics);
    }
    var portBorderTop = portBorder(265, 0, app);
    var portBorderBottom = portBorder(265, 297, app);
}
function startAction() {
    spawnShip();
    setInterval(function () {
        spawnShip();
    }, spawnInterval);
}
function spawnShip() {
    var freeQueue;
    var ship;
    gateQueue.forEach(function (queue, quePosition) {
        if (queue && typeof freeQueue != "number") {
            freeQueue = quePosition;
        }
    });
    if (freeQueue >= 0) {
        var isEmpty = !Math.round(Math.random());
        if (isEmpty) {
            ship = {
                isEmpty: isEmpty,
                ship: drawObject(0, 0, 90, 40, blueColor, greenColor, 5),
                cargo: drawObject(0, 0, 90, 40, greenColor),
                queuePos: freeQueue
            };
            ship.cargo.width = 0;
        }
        else {
            ship = {
                isEmpty: isEmpty,
                ship: drawObject(0, 0, 90, 40, blueColor, redColor, 5),
                cargo: drawObject(0, 0, 90, 40, redColor),
                queuePos: freeQueue
            };
        }
        var y = getRndIn();
        ship.ship.x = 805;
        ship.ship.y = y;
        ship.cargo.x = 805;
        ship.cargo.y = y;
        app.stage.addChild(ship.ship);
        app.stage.addChild(ship.cargo);
        ships.push(ship);
        goToPos(ship);
    }
}
function goToNextQueue(ship) {
    var firstQueuePos = { x: 280, y: 137 };
    var duration;
    duration = 1000 + 1000 * ship.queuePos;
    setTimeout(function () {
        new TWEEN.Tween(ship.ship)
            .to({ x: firstQueuePos.x + 100 * ship.queuePos, y: firstQueuePos.y }, duration)
            .onComplete(function () {
            gateQueue[ship.queuePos] = false;
        })
            .start();
        new TWEEN.Tween(ship.cargo)
            .to({ x: firstQueuePos.x + 100 * ship.queuePos, y: firstQueuePos.y }, duration)
            .start();
    }, 800);
}
function goToPos(ship) {
    var firstQueuePos = { x: 280, y: 137 };
    var duration;
    duration = 1000 + 1000 * (5 - ship.queuePos);
    new TWEEN.Tween(ship.ship)
        .to({ x: firstQueuePos.x + 100 * ship.queuePos, y: firstQueuePos.y }, duration)
        .onComplete(function () {
        gateQueue[ship.queuePos] = false;
    })
        .start();
    new TWEEN.Tween(ship.cargo)
        .to({ x: firstQueuePos.x + 100 * ship.queuePos, y: firstQueuePos.y }, duration)
        .start();
}
animate();
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
}
function getRndIn() {
    var min = 0;
    var max = 137;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRndOut() {
    var min = 247;
    var max = 425;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
