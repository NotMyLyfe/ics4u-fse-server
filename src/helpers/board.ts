enum NODE{
    NORTH = 0,
    NORTH_EAST = 1,
    SOUTH_EAST = 2, 
    SOUTH = 3,
    SOUTH_WEST = 4,
    NORTH_WEST = 5
}

enum HEXAGON{
    DESERT = 0,
    GRAIN = 1,
    LUMBER = 2,
    WOOL = 3,
    ORE = 4,
    BRICK = 5,
    NUM_OF_NODES = 6,
    NUM_OF_RESOURCES = 6
}

enum BOARD{
    NUM_OF_ROWS = 5,
    NUM_OF_ROWS_INCREASING = 3,
    MAX_NUM_OF_HEXAGONS_PER_ROW = 5,
    NUM_OF_HARBOURS = 9,
    MAX_DICE = 12
}

const NUM_OF_HEXAGONS_PER_ROW = [3, 4, 5, 4, 3];

const HARBOUR_LOC = [
    [0, 0, NODE.NORTH, NODE.NORTH_WEST],
    [0, 1, NODE.NORTH, NODE.NORTH_EAST],
    [1, 0, NODE.NORTH_WEST, NODE.SOUTH_WEST],
    [1, 3, NODE.NORTH, NODE.NORTH_EAST],
    [2, 4, NODE.NORTH_EAST, NODE.SOUTH_EAST],
    [3, 1, NODE.NORTH_WEST, NODE.SOUTH_WEST],
    [3, 4, NODE.SOUTH, NODE.SOUTH_EAST],
    [4, 2, NODE.SOUTH, NODE.SOUTH_WEST],
    [4, 3, NODE.SOUTH, NODE.SOUTH_EAST]
];

export class Node{
    private adjacentNodes : Map<Node, number>;
    private adjacentHex : Array<Hexagon>;
    private user : number;
    private type : number;
    private harbourType : number;

    constructor(){
        this.adjacentNodes = new Map();
        this.adjacentHex = new Array();
        this.user = -1;
        this.type = -1;
        this.harbourType = -1;
    }
    setAdjacentNode(node : Node){
        if(!this.adjacentNodes.has(node)) this.adjacentNodes.set(node, -1);
    }
    setAdjacentHex(hexagon : Hexagon){
        if(!this.adjacentHex.includes(hexagon)) this.adjacentHex.push(hexagon);
    }
    setHarbour(harbourType : number){
        this.harbourType = harbourType;
    }
    setUser(user : number){
        this.user = user;
    }
    getHarbour() : number {
        return this.harbourType;
    }
    getUser() : number{
        return this.user;
    }
    getType() : number {
        return this.type;
    }
    getAdjacentHexagons() : Array<Hexagon> {
        return this.adjacentHex;
    }
    getAdjacentNodes() : Map<Node, number>{
        return this.adjacentNodes;
    }
    setType(type : number) : void {
        this.type = type;
    }
}

class Hexagon{
    private nodes : Array<Node>;
    private hasRobber : boolean;
    private resource : number;
    private tokenNumber : number;

    constructor(resource : number, tokenNumber : number){
        this.nodes = new Array(HEXAGON.NUM_OF_NODES);
        this.resource = resource;
        this.tokenNumber = tokenNumber;
    }
    setNode(node : Node, position : number) : void{
        this.nodes[position] = node;
        this.nodes[position].setAdjacentHex(this);
    }
    getNode(position : number) : Node{
        return this.nodes[position];
    }
    getAllNodes() : Array<Node> {
        return this.nodes;
    }
    getResource() : number{
        return this.resource;
    }
    getToken() : number{
        return this.tokenNumber;
    }
    getValues() : Array<number> {
        return [this.resource, this.tokenNumber];
    }
    robber() : boolean{
        return this.hasRobber;
    }
    setRobber () : void {
        this.hasRobber = !this.hasRobber;
    }
}

export class Board{
    private hexagons : Array<Array<Hexagon>>;
    private rollHexagon : Array<Array<Hexagon>>;
    private robberPosition : Array<number>;
    constructor(){
        this.rollHexagon = new Array(BOARD.MAX_DICE + 1).fill(new Array());
        let numOfResources = [1, 4, 4, 4, 3, 3];
        let numOfRollNumber = [1, 2, 2, 2, 2, 0, 2, 2, 2, 2, 1];
        this.hexagons = new Array(BOARD.NUM_OF_ROWS);

        for(let i = 0; i < BOARD.NUM_OF_ROWS_INCREASING; i++){
            this.hexagons[i] = new Array(BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW);
            for(let j = 0; j < NUM_OF_HEXAGONS_PER_ROW[i]; j++){

                let resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES);
                while(numOfResources[resourceNumber] <= 0){
                    resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES)
                } 
                numOfResources[resourceNumber]--;

                let tokenNumber;
                if(resourceNumber == 0){
                    tokenNumber = 0;
                    this.robberPosition = [i, j];
                }
                else{
                    tokenNumber = Math.floor(Math.random() * 11);
                    while(numOfRollNumber[tokenNumber] <= 0){
                        tokenNumber = Math.floor(Math.random() * 11);
                    }
                    numOfRollNumber[tokenNumber]--;
                    tokenNumber += 2;
                }

                this.hexagons[i][j] = new Hexagon(resourceNumber, tokenNumber);
                this.rollHexagon[tokenNumber].push(this.hexagons[i][j]);

                if(i != 0){
                    if(j != 0){
                        this.hexagons[i][j].setNode(this.hexagons[i - 1][j - 1].getNode(NODE.SOUTH_EAST), NODE.NORTH);
                        this.hexagons[i][j].setNode(this.hexagons[i - 1][j - 1].getNode(NODE.SOUTH), NODE.NORTH_WEST);
                    }
                    if(j != NUM_OF_HEXAGONS_PER_ROW[i] - 1){
                        if(this.hexagons[i][j].getNode(NODE.NORTH) == undefined) 
                            this.hexagons[i][j].setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH_WEST), NODE.NORTH);
                        this.hexagons[i][j].setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH), NODE.NORTH_EAST);
                    }
                }
                if(j != 0){
                    if(this.hexagons[i][j].getNode(NODE.NORTH_WEST) == undefined) 
                        this.hexagons[i][j].setNode(this.hexagons[i][j - 1].getNode(NODE.NORTH_EAST), NODE.NORTH_WEST);
                    this.hexagons[i][j].setNode(this.hexagons[i][j - 1].getNode(NODE.SOUTH_EAST), NODE.SOUTH_WEST);
                }

                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    if(this.hexagons[i][j].getNode(k) == undefined) this.hexagons[i][j].setNode(new Node, k);
                }
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    this.hexagons[i][j].getNode(k).setAdjacentNode(this.hexagons[i][j].getNode((k + HEXAGON.NUM_OF_NODES - 1) % HEXAGON.NUM_OF_NODES));
                    this.hexagons[i][j].getNode(k).setAdjacentNode(this.hexagons[i][j].getNode((k + 1) % HEXAGON.NUM_OF_NODES));
                }
            }
        }
        
        for(let i = BOARD.NUM_OF_ROWS_INCREASING; i < BOARD.NUM_OF_ROWS; i++){
            this.hexagons[i] = new Array(BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW);
            for(let j = 0, index = i - BOARD.NUM_OF_ROWS_INCREASING + 1; j < NUM_OF_HEXAGONS_PER_ROW[i]; j++, index++){
                let resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES);
                while(numOfResources[resourceNumber] <= 0){
                    resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES)
                } 
                numOfResources[resourceNumber]--;

                let tokenNumber;
                if(resourceNumber == 0){
                    tokenNumber = 0;
                    this.robberPosition = [i, index];
                }
                else{
                    tokenNumber = Math.floor(Math.random() * 11);
                    while(numOfRollNumber[tokenNumber] <= 0){
                        tokenNumber = Math.floor(Math.random() * 11);
                    }
                    numOfRollNumber[tokenNumber]--;
                    tokenNumber += 2;
                }

                this.hexagons[i][index] = new Hexagon(resourceNumber, tokenNumber);
                this.rollHexagon[tokenNumber].push(this.hexagons[i][j]);

                this.hexagons[i][index].setNode(this.hexagons[i - 1][index - 1].getNode(NODE.SOUTH), NODE.NORTH_WEST);
                this.hexagons[i][index].setNode(this.hexagons[i - 1][index - 1].getNode(NODE.SOUTH_EAST), NODE.NORTH);
                this.hexagons[i][index].setNode(this.hexagons[i - 1][index].getNode(NODE.SOUTH), NODE.NORTH_EAST);

                if(j != 0) this.hexagons[i][index].setNode(this.hexagons[i][index - 1].getNode(NODE.SOUTH_EAST), NODE.SOUTH_WEST);
                
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    if(this.hexagons[i][index].getNode(k) == undefined) this.hexagons[i][index].setNode(new Node, k);
                }
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    this.hexagons[i][index].getNode(k).setAdjacentNode(this.hexagons[i][index].getNode((k + HEXAGON.NUM_OF_NODES - 1) % HEXAGON.NUM_OF_NODES));
                    this.hexagons[i][index].getNode(k).setAdjacentNode(this.hexagons[i][index].getNode((k + 1) % HEXAGON.NUM_OF_NODES));
                }
            }
        }

        let numOfHarbours = [4, 1, 1, 1, 1, 1];
        HARBOUR_LOC.forEach(element => {
            let harbourType = Math.floor(Math.random() * 6);
            while(numOfHarbours[harbourType] <= 0) {
                harbourType = Math.floor(Math.random() * 6);
            }
            numOfHarbours[harbourType]--;
            this.hexagons[element[0]][element[1]].getNode(element[2]).setHarbour(harbourType);
            this.hexagons[element[0]][element[1]].getNode(element[3]).setHarbour(harbourType);
        });
    }
    getAllHexagons() : Array<Array<Array<number>>>{
        let returnArray = new Array(BOARD.NUM_OF_ROWS);
        for(let i = 0; i < BOARD.NUM_OF_ROWS; i++){
            returnArray[i] = new Array(BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW);
            for(let j = 0; j < BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW; j++){
                returnArray[i][j] = (this.hexagons[i][j] == undefined) ? [-1, -1] : this.hexagons[i][j].getValues();
            }
        }
        return returnArray;
    }
    getAllHarbours() : Array<number> {
        let returnArray = new Array();
        HARBOUR_LOC.forEach(element => {
            returnArray.push(this.hexagons[element[0]][element[1]].getNode(element[2]).getHarbour());
        });
        return returnArray;
    }
    getHexagonsByRoll(roll : number) : Array<Hexagon>{
        return this.rollHexagon[roll];
    }
    getHexagon(row : number, column : number) : Hexagon{
        return this.hexagons[row][column];
    }
    getLongestPath(node : Node, user: number, visitedSegments : Map<Node, Map<Node, boolean>> = new Map(), firstSearch : boolean = true) : number{
        let length = 0;
        if(!firstSearch && node.getUser() != -1 && node.getUser() != user) return length;
        if(!visitedSegments.has(node)) visitedSegments.set(node, new Map());
        for(let [adjNode, road] of node.getAdjacentNodes()){
            if(road != user || visitedSegments.get(node).get(adjNode)) continue;

            visitedSegments.get(node).set(adjNode, true);
            if(!visitedSegments.has(adjNode)) visitedSegments.set(adjNode, new Map());
            visitedSegments.get(adjNode).set(node, true);
            
            let tempLength = this.getLongestPath(adjNode, user, visitedSegments, false) + 1;
            length = (tempLength > length) ? tempLength : length;

            visitedSegments.get(node).set(adjNode, false);
            visitedSegments.get(adjNode).set(node, false);
        }
        return length;
    }
    moveRobber(position : Array<number>) : boolean{
        let hexagon = this.getHexagon(position[0], position[1]);
        if(hexagon == undefined) return false;
        if(hexagon.robber()) return false;
        this.getHexagon(this.robberPosition[0], this.robberPosition[1]).setRobber();
        this.robberPosition = [...position];
        hexagon.setRobber();
        return true;
    }
    collisionRoad(position : Array<Array<number>>) : boolean{
        let hexagons = [this.getHexagon(position[0][0], position[0][1]), this.getHexagon(position[1][0], position[1][1])];
        if(hexagons[0] == undefined || hexagons[1] == undefined){
            return true;
        }
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
        if(!node[0].getAdjacentNodes().has(node[1]) || node[0].getAdjacentNodes().get(node[1]) != -1){
            return true;
        }
        return false;
    }
    validRoad(userNodes : Set<Node>, position : Array<Array<number>>) : boolean {
        if(this.collisionRoad(position)) return false;
        let hexagons = [this.getHexagon(position[0][0], position[0][1]), this.getHexagon(position[1][0], position[1][1])];
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
        if(!userNodes.has(node[0]) && !userNodes.has(node[1])){
            return false;
        }
        return true;
    }
    addRoad(position : Array<Array<number>>, user : number) : void{
        let hexagons = [this.getHexagon(position[0][0], position[0][1]), this.getHexagon(position[1][0], position[1][1])];
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
        node[0].getAdjacentNodes().set(node[1], user);
        node[1].getAdjacentNodes().set(node[0], user);
    }
    validSettlement(position : Array<number>, earlyGame : boolean = true, userNodes : Set<Node> = new Set()) : boolean{
        let hexagon = this.getHexagon(position[0], position[1]);
        if(hexagon == undefined) return false;
        let node = hexagon.getNode(position[2]);
        if(node.getUser() != -1) return false;

        for(let [key, value] of node.getAdjacentNodes()){
            if(key.getUser() != -1) return false;
        }

        if(!earlyGame && !userNodes.has(node)) return false;
        return true;
    }
    addSettlement(position : Array<number>, user:number) : number{
        let hexagon = this.getHexagon(position[0], position[1]);
        let node = hexagon.getNode(position[2]);
        node.setUser(user);
        node.setType(1);
        return node.getHarbour();
    }
    breaksRoad(user : number, position : Array<number>) : number{
        let hexagon = this.getHexagon(position[0], position[1]);
        if(hexagon == undefined) return -1;
        let node = hexagon.getNode(position[2]);
        let knownRoad = -1;
        for(let [key, value] of node.getAdjacentNodes()){
            if(value != user && value != -1){
                if(knownRoad == -1) knownRoad = value;
                else if(knownRoad == value) return value;
                else return -1;
            }
        }
        return -1;
    }
}