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
    [NODE.NORTH, NODE.NORTH_WEST], [NODE.NORTH, NODE.NORTH_EAST], [-1, -1],
    [NODE.NORTH_WEST, NODE.SOUTH_WEST], [-1, -1], [-1, -1], [NODE.NORTH, NODE.NORTH_EAST],
    [-1, -1], [-1, -1], [-1, -1], [-1, -1], [NODE.NORTH_EAST, NODE.SOUTH_EAST],
    [NODE.NORTH_WEST, NODE.SOUTH_WEST], [-1, -1], [-1, -1], [NODE.SOUTH_EAST, NODE.SOUTH],
    [NODE.SOUTH_WEST, NODE.SOUTH], [NODE.SOUTH_EAST, NODE.SOUTH], [-1, -1] 
];

class Node{
    private adjacentNodes : Array<AdjacentNodes>;
    private adjacentHex : Array<Hexagon>;
    private user : number;
    private type : number;

    constructor(){
        this.adjacentNodes = new Array();
        this.adjacentHex = new Array();
        this.user = -1;
        this.type = -1;
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

}

class Hexagon{
    nodes : Array<Node>;
    hasRobber : boolean;
    resource : number;
    constructor(resource : number){
        this.nodes = new Array(HEXAGON.NUM_OF_NODES);
        this.resource = resource;
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
    hexagons : Array<Array<Hexagon>>;
    constructor(){
        let numOfResources = [1, 4, 4, 4, 3, 3];
        this.hexagons = new Array(MainBoard.NUM_OF_ROWS);

        for(let i = 0; i < MainBoard.NUM_OF_ROWS_INCREASING; i++){
            this.hexagons[i] = new Array(NUM_OF_HEXAGONS_PER_ROW[i]);
            for(let j = 0; j < NUM_OF_HEXAGONS_PER_ROW[i]; j++){
                let resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES);
                while(numOfResources[resourceNumber] <= 0){
                    resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES)
                } 
                numOfResources[resourceNumber]--;
                let tempHexagon = new Hexagon(resourceNumber);

                if(i != 0){
                    if(j != 0){
                        tempHexagon.setNode(this.hexagons[i - 1][j - 1].getNode(NODE.SOUTH_EAST), NODE.NORTH);
                        tempHexagon.setNode(this.hexagons[i - 1][j - 1].getNode(NODE.SOUTH), NODE.NORTH_WEST);
                    }
                    if(j != NUM_OF_HEXAGONS_PER_ROW[i] - 1){
                        if(tempHexagon.getNode(NODE.NORTH) == undefined) 
                            tempHexagon.setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH_WEST), NODE.NORTH);
                        tempHexagon.setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH), NODE.NORTH_EAST);
                    }
                }
                if(j != 0){
                    if(tempHexagon.getNode(NODE.NORTH_WEST) == undefined) 
                        tempHexagon.setNode(this.hexagons[i][j - 1].getNode(NODE.NORTH_EAST), NODE.NORTH_WEST);
                    tempHexagon.setNode(this.hexagons[i][j - 1].getNode(NODE.SOUTH_EAST), NODE.SOUTH_WEST);
                }

                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    if(tempHexagon.getNode(k) == undefined) tempHexagon.setNode(new Node, k);
                }
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    tempHexagon.getNode(k).setAdjacentNode(tempHexagon.getNode((k + HEXAGON.NUM_OF_NODES - 1) % HEXAGON.NUM_OF_NODES));
                    tempHexagon.getNode(k).setAdjacentNode(tempHexagon.getNode((k + 1) % HEXAGON.NUM_OF_NODES));
                }

                this.hexagons[i][j] = (tempHexagon);
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
                let tempHexagon = new Hexagon(resourceNumber);

                tempHexagon.setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH), NODE.NORTH_WEST);
                tempHexagon.setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH_EAST), NODE.NORTH);
                tempHexagon.setNode(this.hexagons[i - 1][j + 1].getNode(NODE.SOUTH), NODE.NORTH_EAST);
                if(j != 0) tempHexagon.setNode(this.hexagons[i][j - 1].getNode(NODE.SOUTH_EAST), NODE.SOUTH_WEST);
                
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    if(tempHexagon.getNode(k) == undefined) tempHexagon.setNode(new Node, k);
                }
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    tempHexagon.getNode(k).setAdjacentNode(tempHexagon.getNode((k + HEXAGON.NUM_OF_NODES - 1) % HEXAGON.NUM_OF_NODES));
                    tempHexagon.getNode(k).setAdjacentNode(tempHexagon.getNode((k + 1) % HEXAGON.NUM_OF_NODES));
                }

                this.hexagons[i][j] = (tempHexagon);
            }
        }
    }
}