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

enum MainBoard{
    NUM_OF_ROWS = 5,
    NUM_OF_ROWS_INCREASING = 3
}

const NUM_OF_HEXAGONS_PER_ROW = [3, 4, 5, 4, 3];

interface AdjacentNodes{
    node : Node,
    road : number
}

const HARBOUR_LOC = [
    [0, 0, NODE.NORTH, NODE.NORTH_WEST],
    [0, 1, NODE.NORTH, NODE.NORTH_EAST],
    [1, 0, NODE.NORTH_WEST, NODE.SOUTH_WEST],
    [1, 3, NODE.NORTH, NODE.NORTH_EAST],
    [2, 4, NODE.NORTH_EAST, NODE.SOUTH_EAST],
    [3, 0, NODE.NORTH_WEST, NODE.SOUTH_WEST],
    [3, 3, NODE.SOUTH, NODE.SOUTH_EAST],
    [4, 0, NODE.SOUTH, NODE.SOUTH_WEST],
    [4, 1, NODE.SOUTH, NODE.SOUTH_EAST]
]

class Node{
    private adjacentNodes : Array<AdjacentNodes>;
    private adjacentHex : Array<Hexagon>;
    private user : number;
    private type : number;
    private harbourType : number;

    constructor(){
        this.adjacentNodes = new Array();
        this.adjacentHex = new Array();
        this.user = -1;
        this.type = -1;
        this.harbourType = -1;
    }
    setAdjacentNode(node : Node){
        if(!this.adjacentNodes.some(element => element.node == node)) this.adjacentNodes.push({
            node : node,
            road : -1
        });
    }
    setAdjacentHex(hexagon : Hexagon){
        if(!this.adjacentHex.includes(hexagon)) this.adjacentHex.push(hexagon);
    }
    setHarbour(harbourType : number){
        this.harbourType = harbourType;
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
}

export default class Board{
    private hexagons : Array<Array<Hexagon>>;
    constructor(){
        let numOfResources = [1, 4, 4, 4, 3, 3];
        let numOfRollNumber = [1, 2, 2, 2, 2, 0, 2, 2, 2, 2, 1];
        this.hexagons = new Array(MainBoard.NUM_OF_ROWS);

        for(let i = 0; i < MainBoard.NUM_OF_ROWS_INCREASING; i++){
            this.hexagons[i] = new Array(NUM_OF_HEXAGONS_PER_ROW[i]);
            for(let j = 0; j < NUM_OF_HEXAGONS_PER_ROW[i]; j++){

                let resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES);
                while(numOfResources[resourceNumber] <= 0){
                    resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES)
                } 
                numOfResources[resourceNumber]--;

                let tokenNumber;
                if(resourceNumber == 0){
                    tokenNumber = 0;
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
        
        for(let i = MainBoard.NUM_OF_ROWS_INCREASING; i < MainBoard.NUM_OF_ROWS; i++){
            this.hexagons[i] = new Array(NUM_OF_HEXAGONS_PER_ROW[i]);
            for(let j = 0; j < NUM_OF_HEXAGONS_PER_ROW[i]; j++){
                let resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES);
                while(numOfResources[resourceNumber] <= 0){
                    resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES)
                } 
                numOfResources[resourceNumber]--;

                let tokenNumber;
                if(resourceNumber == 0){
                    tokenNumber = 0;
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

                this.hexagons[i][j].setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH), NODE.NORTH_WEST);
                this.hexagons[i][j].setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH_EAST), NODE.NORTH);
                this.hexagons[i][j].setNode(this.hexagons[i - 1][j + 1].getNode(NODE.SOUTH), NODE.NORTH_EAST);
                if(j != 0) this.hexagons[i][j].setNode(this.hexagons[i][j - 1].getNode(NODE.SOUTH_EAST), NODE.SOUTH_WEST);
                
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    if(this.hexagons[i][j].getNode(k) == undefined) this.hexagons[i][j].setNode(new Node, k);
                }
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    this.hexagons[i][j].getNode(k).setAdjacentNode(this.hexagons[i][j].getNode((k + HEXAGON.NUM_OF_NODES - 1) % HEXAGON.NUM_OF_NODES));
                    this.hexagons[i][j].getNode(k).setAdjacentNode(this.hexagons[i][j].getNode((k + 1) % HEXAGON.NUM_OF_NODES));
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
}