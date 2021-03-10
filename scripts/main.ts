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
    isEmpty:boolean,
    isBusy:boolean,
    cargo:PIXI.Graphics,
    pier:PIXI.Graphics
}

interface IShip {
    isEmpty:boolean,
    cargo:PIXI.Graphics,
    ship:PIXI.Graphics,
    queuePos?: number,
    toDelete?:boolean,
    toPier?:IPier,
}

let outQueue:IShip[] = [];
let piers:IPier[] = [];
let ships: IShip[] = [];
//let gateQueue:boolean[] = new Array(5).fill(true);
let gateQueue:boolean[] = [
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
let queueMove:boolean = false;

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

                    }
                    else {
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
            goToPos(ship, true);
        }
    });
}

function CargoOnShip(ship:IShip, pier:IPier, move:string):void{
    let width:number;

        switch (move) {
            case "LoadShip":
                width = 90;
                break;
            case "UnLoadShip":
                width = 0;
                break;
            default:
                console.log("No move");
                break;
        }

    new TWEEN.Tween(ship.cargo)
        .to({width:width})
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

function CargoOnPier(pier:IPier, move:string):void{
    let width:number;
    let nextStep:void;
    let x:number;

    switch (move) {
        case "LoadPier":
            width = 0;
            x = 10;
            nextStep = AfterLoading();
            break;
        case "UnLoadPier":
            width = 40;
            x = 0;
            nextStep = AfterUnLoading();
            break;
        default:
            console.log("No move");
            break;
    }

    new TWEEN.Tween(pier.cargo)
        .to({width:width, x:x})
        .duration(5000)
        .onComplete(()=>{
            nextStep;
        })
        .start()

    function AfterLoading():void {
        pier.isEmpty = false;
    }

    function AfterUnLoading():void {
        pier.isEmpty = true;
    }

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
    let y = getRnd("OUT")
    new TWEEN.Tween(ship.ship)
        .to({x: 805, y: y})
        .duration(4000)
        .onComplete(()=>{
            ships.forEach((ship, index)=>{
                if(ship.toDelete)
                    ships.splice(index,1)
            });
        })
        .start();
    new TWEEN.Tween(ship.cargo)
        .to({x: 805, y: y})
        .duration(4000)
        .start();
}

function goToPier(ship: IShip, pier: IPier) {
    moveToPort = true;
    gateQueue[ship.queuePos] = true;
    ship.toDelete = true;
    gateClosed = true;
    pier.isBusy = true;
    let coords:ICoords;
    let x = ship.ship.getBounds().x;
    let duration = 2000;

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
        duration *=2;
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
        coords.x.push(165, 165, 165, 60);
        coords.y.push(192, 111, 35, 35);
        duration += 1000*4;
    }
    else if(pier.id===1){
        coords.x.push(165, 165, 60);
        coords.y.push(192, 140, 140);
        duration += 1000*2;
    }
    else if(pier.id===2){
        coords.x.push(165, 165, 60);
        coords.y.push(192, 245, 245);
        duration += 1000*2;
    }
    else if(pier.id===3){
        coords.x.push(165, 165, 165, 60);
        coords.y.push(192, 273, 350, 350);
        duration += 1000*4;
    }

    ship.queuePos = null;
    new TWEEN.Tween(ship.ship)
        .to({x: coords.x, y: coords.y})
        .duration(duration)
        .interpolation(TWEEN.Interpolation.Linear)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    new TWEEN.Tween(ship.cargo)
        .to({x: coords.x, y: coords.y})
        .duration(duration)
        .interpolation(TWEEN.Interpolation.Linear)
        .easing(TWEEN.Easing.Quadratic.Out)
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
        CargoOnPier(pier, "LoadPier");
        CargoOnShip(ship, pier, "UnLoadShip");
    }
    else {
        CargoOnPier(pier, "UnLoadPier");
        CargoOnShip(ship, pier, "LoadShip");
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

    let portBorderTop = drawObject(265, 0,10,128, yellowColor);
    app.stage.addChild(portBorderTop);
    let portBorderBottom = drawObject(265, 297,10,128,yellowColor);
    app.stage.addChild(portBorderBottom);

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

    gateQueue.forEach((queueMember, quePosition) => {
        if (queueMember && typeof freeQueue != "number") {
            freeQueue = quePosition;
        }
    });
    if (freeQueue >= 0) {
        let isEmpty:boolean;

        let emptyShips:number = 0;
        ships.forEach((ship)=>{
            if(!ship.toDelete && ship.isEmpty){
                emptyShips++;
            }
        })
        if(emptyShips===4 )
            isEmpty=false;
        else if(emptyShips===0 )
            isEmpty=true;
        else
            isEmpty = !Math.round(Math.random());

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
        let y = getRnd("IN");
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

function goToPos(ship:IShip, queueMove?:boolean){
    let firstQueuePos={ x:280, y:137}
    let duration: number;
    let delay = 0;

    if(queueMove){
        duration = 1000+1000*ship.queuePos;
        delay = 800;
    }
    else{
        if(ship.queuePos === 4)
            duration = 3000;
        else
            duration = 1000+1000*(5-ship.queuePos);
    }

    new TWEEN.Tween(ship.ship)
        .to({x: firstQueuePos.x + 100*ship.queuePos, y: firstQueuePos.y}, duration)
        .onComplete(() => {
            gateQueue[ship.queuePos] = false;
        })
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(delay)
        .start();

    new TWEEN.Tween(ship.cargo)
        .to({x: firstQueuePos.x + 100*ship.queuePos, y: firstQueuePos.y}, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(delay)
        .start();
}

animate()

function animate() {
    requestAnimationFrame(animate)
    TWEEN.update()
}

function getRnd(direction:string):number {

    if(direction === "IN"){
        const min:number = 0;
        const max:number = 137;
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }
    else if(direction === "OUT"){
        const min:number = 247;
        const max:number = 425;
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }

}



