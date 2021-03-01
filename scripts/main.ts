import * as PIXI from 'pixi.js'
import * as TWEEN from "../tween.js";

let app = new PIXI.Application({
    width:800,
    height:425
});
document.body.appendChild(app.view);

const yellowColor = 0xf8fc03;
const blueColor = 0x0384fc;
const redColor = 0xfc0703;
const greenColor = 0x3dfc03;

interface ICoords {
    x:number[],
    y:number[]

}
interface IPier {
    id:number,
    coords:ICoords,
    isEmpty:boolean,
    isBusy:boolean,
    cargo:PIXI.Graphics,
    pier:PIXI.Graphics
}

interface IShip {
    isEmpty:boolean,
    cargo:PIXI.Graphics,
    ship:PIXI.Graphics,
    sheepTween?: TWEEN.Tween<any>,
    queuePos?: number,
    toDelte?:boolean,
    toPier?:IPier,
}

let outQueue:IShip[] = [];
let piers:IPier[] = [];
let ships: IShip[] = [];
let gateQueue: boolean[] = [
    true,
    true,
    true,
    true,
    true
];
let gateClosed: boolean = false;
let moveFromPort:boolean = false;
let moveToPort:boolean = false;
const spawnInterval: number = 8000;

Start();

function Start(){
    initSea();
    initPiers();
    startAction();
    initGate();
}

function initPiers() {
    for (let i = 0; i < 4; i++) {
        piers[i] = {
            id:i,
            cargo: drawObject(10, 10 + 105 * i, 40, 90, blueColor),
            pier: drawObject(10, 10 + 105 * i, 40, 90, yellowColor, yellowColor, 10),
            isBusy: false,
            isEmpty: true,
            coords: {
                x: [165, 60],
                y: [35 + 105 * i, 35 + 105 * i]
            }
        }
        app.stage.addChild(piers[i].pier);
        app.stage.addChild(piers[i].cargo);
    }
}

function drawObject(x:number, y:number, width:number, height:number, color:number, lineColor?:number , lineWidth?:number):PIXI.Graphics {
    const shape = new PIXI.Graphics();
    if(lineColor)
        shape.lineStyle(lineWidth,lineColor)
    shape.beginFill(color);
    shape.drawRect(x, y, width, height);
    shape.endFill();
    return shape;
}

function initGate() {
    setInterval(() => {
        let currentShip: IShip = null;

            gateQueue.forEach((isFree, queueIndex: number) => {
                if (!currentShip && !isFree) {
                    ships.forEach((ship)=>{
                        if(ship.queuePos === queueIndex){
                            currentShip = ship;
                        }
                    });

                    let rightPier: IPier = getRightPier(currentShip);

                    if (rightPier) {
                        currentShip.toPier = rightPier;

                        if (!gateClosed && !moveFromPort){

                            goToPier(currentShip, rightPier);
                            shiftAllShips();
                        }

                    } else {
                        currentShip = null;
                    }
                }
            });
    }, 500);
}

function shiftAllShips(){

    ships.forEach((ship) => {
        if (ship && ship.queuePos && ship.queuePos !== 0 && gateQueue[ship.queuePos - 1]) {
            gateQueue[ship.queuePos] = true;
            gateQueue[ship.queuePos - 1] = false;
            ship.queuePos -= 1;
            goToNextQueue(ship);
        }
    });
}

function UnLoadShip(ship:IShip, pier:IPier):void{
    new TWEEN.Tween(ship.cargo)
        .to({width:0})
        .duration(5000)
        .onComplete(()=>{
            if(!moveToPort){
                goOut(ship, pier);
            }
            else{
                outQueue.push(ship);
            }
        })
        .start()
}

function LoadShip(ship:IShip, pier:IPier):void{
    new TWEEN.Tween(ship.cargo)
        .to({width:90})
        .duration(5000)
        .onComplete(()=>{
            if(!moveToPort){
                goOut(ship, pier);
            }
            else{
                outQueue.push(ship);
            }
        })
        .start()
}

function LoadPier(pier:IPier):void{
    new TWEEN.Tween(pier.cargo)
        .to({width:0, x:10})
        .duration(5000)
        .onComplete(()=>{
            pier.isEmpty = false;
        })
        .start()
}

function UnLoadPier (pier:IPier):void{
    new TWEEN.Tween(pier.cargo)
        .to({width:40, x:0})
        .duration(5000)
        .onComplete(()=>{
            pier.isEmpty = true;
        })
        .start()
}

function goOut(ship:IShip, pier:IPier){
    moveFromPort = true;
    gateClosed = true;
    let outCoord:ICoords;

    if(pier.id===2){
        outCoord = {
            x:[165,280],
            y:[ship.ship.getBounds().y,247]
        }
    }
    else{
        outCoord = {
            x:[165, 165,280],
            y:[ship.ship.getBounds().y,247,247]
        }
    }

    new TWEEN.Tween(ship.ship)
        .to({x: outCoord.x, y: outCoord.y})
        .duration(4000)
        .interpolation(TWEEN.Interpolation.Linear)
        .start();
    new TWEEN.Tween(ship.cargo)
        .to({x: outCoord.x, y: outCoord.y})
        .duration(4000)
        .interpolation(TWEEN.Interpolation.Linear)
        .onComplete(()=> {
            gateClosed = false;
            pier.isBusy = false;
            moveFromPort = false;
            goFarAway(ship);
            }
        )
        .start();

    outCoord = null;
}

function goFarAway(ship:IShip){
    let y = getRndOut()
    new TWEEN.Tween(ship.ship)
        .to({x: 805, y: y})
        .duration(4000)
        .onComplete(()=>{
            ships.forEach((ship, index)=>{
                if(ship.toDelte)
                    ships.splice(index,1)
            });
        })
        .start();
    ship.sheepTween = new TWEEN.Tween(ship.cargo)
        .to({x: 805, y: y})
        .duration(4000)
        .start();
}

function goToPier(ship: IShip, pier: IPier) {
    moveToPort = true;
    gateQueue[ship.queuePos] = true;

    ship.toDelte = true;
    gateClosed = true;
    pier.isBusy = true;
    let coords:ICoords;
    let x = ship.ship.getBounds().x;
    let duration = 1000;

    if(ship.queuePos===0){
        coords = {
            x:[x],
            y:[192]
        }
    }
    else if(ship.queuePos===1){
        coords = {
            x:[x, x-100],
            y:[192, 192]
        }
        duration *= 2;
    }
    else if(ship.queuePos===2){
        coords = {
            x:[x, x-100,x-200],
            y:[192, 192, 192]
        }
        duration *= 3;
    }
    else if(ship.queuePos===3){
        coords = {
            x:[x, x-100,x-200, x-300],
            y:[192, 192, 192, 192]
        }
        duration *= 4;
    }
    else if(ship.queuePos===4){
        coords = {
            x:[x, x-100,x-200, x-300, x-400],
            y:[192, 192, 192, 192, 192]
        }
        duration *= 5;
    }

    if(pier.id===0){
        coords.x.push(165, 165);
        coords.y.push(192, 111);
        duration += 1000*4;
    }
    else if(pier.id===1){
        coords.x.push(165);
        coords.y.push(192);
        duration += 1000*2;
    }
    else if(pier.id===2){
        coords.x.push(165);
        coords.y.push(192);
        duration += 1000*2;
    }
    else if(pier.id===3){
        coords.x.push(165, 165);
        coords.y.push(192, 273);
        duration += 1000*4;
    }

    pier.coords.x.forEach((x)=>{
        coords.x.push(x);
    })
    pier.coords.y.forEach((y)=>{
        coords.y.push(y);
    })
    ship.queuePos = null;
    new TWEEN.Tween(ship.ship)
        .to({x: coords.x, y: coords.y})
        .duration(duration)
        .interpolation(TWEEN.Interpolation.Linear)
        .start();
    new TWEEN.Tween(ship.cargo)
        .to({x: coords.x, y: coords.y})
        .duration(duration)
        .interpolation(TWEEN.Interpolation.Linear)
        .onComplete(()=> {
                gateClosed = false;
                startPierLoading(pier, ship);
                moveToPort=false;

                outQueue.forEach((ship, index)=>{
                        goOut(ship, ship.toPier);
                        outQueue.splice(index, 1);
                    });
            }
        )
        .start();

    coords = null;
}

function startPierLoading(pier: IPier, ship: IShip) {

    if(pier.isEmpty){
        LoadPier(pier);
        UnLoadShip(ship, pier);
    }
    else {
        UnLoadPier(pier);
        LoadShip(ship, pier);
    }
}

function getRightPier(ship: IShip): IPier {
    let correctPier: IPier = null;

    piers.forEach((pier) => {
        if (!pier.isBusy && pier.isEmpty === !ship.isEmpty) {
            correctPier = pier;
        }
    });

    return correctPier;
}

function initSea():void{

    const seaTexture = PIXI.Texture.from('images/sea.jpg');
    const seaBackground = new PIXI.Sprite(seaTexture);
    seaBackground.x = 0;
    seaBackground.y = 0;
    seaBackground.width = 800;
    seaBackground.height = 425;

    app.stage.addChild(seaBackground);

    function portBorder(x:number, y:number,app:PIXI.Application):void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xf8fc03);
        graphics.drawRect(x, y, 10, 128);
        graphics.endFill();
        app.stage.addChild(graphics);
    }

    let portBorderTop = portBorder(265, 0,app);
    let portBorderBottom = portBorder(265, 297,app);

}

function startAction() {
    spawnShip()
    setInterval(() => {
        spawnShip();
    }, spawnInterval);
}

function spawnShip(){
    let freeQueue: number;
    let ship: IShip;

    gateQueue.forEach((queue, quePosition) => {
        if (queue && typeof freeQueue != "number") {
            freeQueue = quePosition;
        }
    });
    if (freeQueue >= 0) {
        let isEmpty = !Math.round(Math.random());

        if(isEmpty){
            ship = {
                isEmpty:isEmpty,
                ship:drawObject(0, 0, 90, 40, blueColor, greenColor, 5),
                cargo:drawObject(0, 0, 90, 40, greenColor),
                queuePos: freeQueue
            }
            ship.cargo.width = 0;
        }
        else {
            ship = {
                isEmpty:isEmpty,
                ship:drawObject(0, 0, 90, 40, blueColor, redColor, 5),
                cargo:drawObject(0, 0, 90, 40, redColor),
                queuePos: freeQueue
            }
        }
        let y = getRndIn();
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

function goToNextQueue(ship:IShip){
    let firstQueuePos={ x:280, y:137}
    let duration: number;
    duration = 1000+1000*ship.queuePos;
    setTimeout(()=>{
    new TWEEN.Tween(ship.ship)
        .to({x: firstQueuePos.x + 100*ship.queuePos, y: firstQueuePos.y}, duration)
        .onComplete(() => {
            gateQueue[ship.queuePos] = false;
        })
        .start();

    new TWEEN.Tween(ship.cargo)
        .to({x: firstQueuePos.x + 100*ship.queuePos, y: firstQueuePos.y}, duration)
        .start();
},800)
}

function goToPos(ship:IShip){
    let firstQueuePos={ x:280, y:137}
    let duration: number;
    duration = 1000+1000*(5-ship.queuePos);

    new TWEEN.Tween(ship.ship)
        .to({x: firstQueuePos.x + 100*ship.queuePos, y: firstQueuePos.y}, duration)
        .onComplete(() => {
            gateQueue[ship.queuePos] = false;
        })
        .start();

    new TWEEN.Tween(ship.cargo)
        .to({x: firstQueuePos.x + 100*ship.queuePos, y: firstQueuePos.y}, duration)
        .start();
}

animate()

function animate() {
    requestAnimationFrame(animate)
    TWEEN.update()
}

function getRndIn():number {
    const min:number = 0;
    const max:number = 137;
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function getRndOut():number {
    const min:number = 247;
    const max:number = 425;
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}



