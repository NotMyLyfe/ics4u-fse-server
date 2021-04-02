// board.ts
// Gordon Lin
// Contains classes relating to the board of the game, which includes each node that surrounds each hexagon of the board, each hexagon on the board, and the board of the game itself

// Enumerators for the nodes, which contains the index for each node in the arrays of nodes each hexagon stores
// Starts at the top (north) of each hexagon with 0, and goes in a clockwise order
enum NODE{
    NORTH = 0,
    NORTH_EAST = 1,
    SOUTH_EAST = 2, 
    SOUTH = 3,
    SOUTH_WEST = 4,
    NORTH_WEST = 5
}

// Enumerators for the hexagons
// Stores the numerical representation of each resource in the game
// Also stores the number of nodes each hexagon has, as well as the number of possible resources there are in the game
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

// Enumerators for the board
// Stores the numebr of rows that the board stores
// Stores the first index after the middle of the board, whhhich is the 3rd index
// Stores the max number of hexagons per row
// Stores the number of harbours there are in the game
// Stores thre max dice value of the game
enum BOARD{
    NUM_OF_ROWS = 5,
    INDEX_AFTER_MIDDLE = 3,
    MAX_NUM_OF_HEXAGONS_PER_ROW = 5,
    NUM_OF_HARBOURS = 9,
    MAX_DICE = 12
}

// Constant which stores the number of hexagons there are per row
const NUM_OF_HEXAGONS_PER_ROW = [3, 4, 5, 4, 3];

// Constant which stores harbour location on the board
// Each harbour is adjacent to one hexagon, connected by 2 nodes
// Each position contains the row of the hexagon, the column of the hexagon, and the 2 node locations on the hexagon
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

// Class which stores each individual node on the board
export class Node{
    // Map which maps each adjacent node, alongside a numerical representation of which user has a road connecting to the adjacent nodes (-1 being no road at all)
    private adjacentNodes : Map<Node, number>;
    // Array which stores all the hexagons that are adjacent to the node
    private adjacentHex : Array<Hexagon>;
    // Variable which stores which user has a settlement on this node (-1 being no settlement at all)
    private user : number;
    // Variable which stores what type of settlement is on this node (-1 being no settlement, 1 being a normal settlement, and 2 being a city)
    private type : number;
    // Variable which stores if there's a harbour adjacent to this node (-1 being none, 0 being a generic harbour, and the 1-5 being the resources mentioned in the HEXAGONS enum)
    private harbourType : number;

    // Constructor of the Node class
    constructor(){
        // Creates new Map and Array for the adjancent nodes and adjacent hexagons
        this.adjacentNodes = new Map();
        this.adjacentHex = new Array();
        
        // Sets the node to default value of -1 as the board is empty
        this.user = -1;
        this.type = -1;
        this.harbourType = -1;
    }
    // Method that adds an adjacent node
    addAdjacentNode(node : Node) : void{
        // Checks if a node doesn't already exist in the map of adjacent nodes, and adds it to the map, with a road value of -1
        if(!this.adjacentNodes.has(node)) this.adjacentNodes.set(node, -1);
    }
    // Method that adds adjacent hexagons
    addAdjacentHex(hexagon : Hexagon) : void{
        // Checks if a hexagon is not already included in the array of hexagons, and adds it to the array of hexagons
        if(!this.adjacentHex.includes(hexagon)) this.adjacentHex.push(hexagon);
    }
    // Method that sets the harbour type
    setHarbour(harbourType : number) : void{
        // Sets harbourType to the harbour type specified
        this.harbourType = harbourType;
    }
    // Sets the user of the node to the user that's settled at that node
    setUser(user : number) : void{
        this.user = user;
    }
    // Sets the type of settlement to the type specified
    setType(type : number) : void {
        this.type = type;
    }

    // Getter methods
    // Gets the harbour type
    getHarbour() : number {
        return this.harbourType;
    }
    // Gets the user that's settle at this node
    getUser() : number{
        return this.user;
    }
    // Gets the type of settlement at this node
    getType() : number {
        return this.type;
    }
    // Gets all the adjacent hexagons of the node
    getAdjacentHexagons() : Array<Hexagon> {
        return this.adjacentHex;
    }
    // Gets all the adjacent nodes to this node
    getAdjacentNodes() : Map<Node, number>{
        return this.adjacentNodes;
    }
}

// Class which stores each hexagon on the board
class Hexagon{
    // Array which stores all the nodes that surround the hexagon
    private nodes : Array<Node>;
    // Boolean that stores whether or not this hexagon contains the robber
    private hasRobber : boolean;
    // Variable that stores the numerical value for the type of resource
    private resource : number;
    // Variable that stores the token value of the hexagon
    private tokenNumber : number;

    // Constructor for the hexagon, which requires the numerical representation of the resource of the hexagon, the token number of the hexagon, and whether or not this hexagon contains the robber
    constructor(resource : number, tokenNumber : number, hasRobber : boolean){
        // Creates a new array with the size of number of nodes that will surround the hexagon
        this.nodes = new Array(HEXAGON.NUM_OF_NODES);
        // Assigns the values specified in the parameters
        this.resource = resource;
        this.tokenNumber = tokenNumber;
        this.hasRobber = hasRobber;
    }
    // Sets the nodes that surround the hexagon in the array
    setNode(node : Node, position : number) : void{
        // Adds the node specified at the position specified
        this.nodes[position] = node;
        // Tells the node to add the current hexagon as an adjacent hexagon
        this.nodes[position].addAdjacentHex(this);
    }
    // Sets the robber 
    setRobber () : void {
        this.hasRobber = !this.hasRobber;
    }

    // Getter methods
    // Gets the node at the specified position
    getNode(position : number) : Node{
        return this.nodes[position];
    }
    // Gets all the nodes that surround the hexagon
    getAllNodes() : Array<Node> {
        return this.nodes;
    }
    // Get the numerical representaiton of type of resource
    getResource() : number{
        return this.resource;
    }
    // Get the token number of the hexagon
    getToken() : number{
        return this.tokenNumber;
    }
    // Get the both the resource number and token number as an array
    getValues() : Array<number> {
        return [this.resource, this.tokenNumber];
    }
    // Gets whether the robber is at the current hexagon or not
    getRobber() : boolean{
        return this.hasRobber;
    }
}

// Class which stores all the hexagons of the board and all the board data
export class Board{
    // 2D array of hexagons storing the grid of hexagons of the board (stored by row, then column)
    private hexagons : Array<Array<Hexagon>>;
    // 2D array of hexagons storing the hexagons corresponding to their token number
    private rollHexagon : Array<Array<Hexagon>>;
    // Array which stores the position of the robber on the board
    private robberPosition : Array<number>;
    
    // Constructor of the board
    constructor(){
        // Creates a new array for the hexagons corresponding to their token number, and fills them with empty arrays
        this.rollHexagon = new Array(BOARD.MAX_DICE + 1);
        for(let i = 0; i <= BOARD.MAX_DICE; i++) this.rollHexagon[i] = new Array();

        // Array used for storing number of each resources left that will be distributed amongst the hexagons on the board
        let numOfResources = [1, 4, 4, 4, 3, 3];
        // Array used for storing number of each token number left that will be distributed amongst the hexagons on the board
        let numOfRollNumber = [1, 2, 2, 2, 2, 0, 2, 2, 2, 2, 1];

        // Creates a new array for the grid of hexagons with number o
        this.hexagons = new Array(BOARD.NUM_OF_ROWS);

        // Loops through all the rows up to and including the middle
        for(let i = 0; i < BOARD.INDEX_AFTER_MIDDLE; i++){
            // Sets the current row to a new Array with a size of max num of hexagons of this row
            this.hexagons[i] = new Array(BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW);

            // Loops through the max number of hexagons of this row
            for(let j = 0; j < NUM_OF_HEXAGONS_PER_ROW[i]; j++){
                // Gets a random resource that is still available
                let resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES);
                while(numOfResources[resourceNumber] <= 0){
                    resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES)
                } 
                // Removes 1 from that resource, as that resource will now be used to generate a new hexagon
                numOfResources[resourceNumber]--;

                // Creates new variable that stores the token numebr of the hexagon
                let tokenNumber : number;
                // If the resource is the desert, sets the token number to 0, as you can't roll for the desert
                // Sets the robber position to the desert as the robber starts in the desert
                if(resourceNumber == HEXAGON.DESERT){
                    tokenNumber = 0;
                    this.robberPosition = [i, j];
                }
                // If it's not the desert, generates a random token number that is still available
                else{
                    // Generates a number from 0-10 as the only available dice numbers you can roll are 2-12, and there's 11 digits between 2 and 12 (inclusive)
                    tokenNumber = Math.floor(Math.random() * 11);
                    while(numOfRollNumber[tokenNumber] <= 0){
                        tokenNumber = Math.floor(Math.random() * 11);
                    }
                    // Removes 1 from that token numebr, as that token number we be used to generate a hexagon
                    numOfRollNumber[tokenNumber]--;
                    // Adds 2 to the token number as the lowest dice value is 2
                    tokenNumber += 2;
                }

                // Creates a new Hexagon at the row and column in the loop, with the resourceNumber, tokenNumber, and whether the resource of the hexagon is the desert (as robbers start in the desert)
                this.hexagons[i][j] = new Hexagon(resourceNumber, tokenNumber, resourceNumber == HEXAGON.DESERT);
                // Adds the hexagon to the rollHexagon array at the token number of the hexagon
                this.rollHexagon[tokenNumber].push(this.hexagons[i][j]);

                // Getting nodes that are shared amongst adjacent hexagons
                // If not at the first row of hexagons
                if(i != 0){
                    // If not at the first column of hexagons in the row
                    if(j != 0){
                        // Setting shared nodes between the current hexagon and the adjacent hexagon to the north west
                        // Sets the nodes of the north and north west of the current hexagon to the south and south east nodes of the hexagon to the north west of the current hexagon
                        this.hexagons[i][j].setNode(this.hexagons[i - 1][j - 1].getNode(NODE.SOUTH_EAST), NODE.NORTH);
                        this.hexagons[i][j].setNode(this.hexagons[i - 1][j - 1].getNode(NODE.SOUTH), NODE.NORTH_WEST);
                    }
                    // If not at the last column of hexagons in this row in the grid
                    if(j != NUM_OF_HEXAGONS_PER_ROW[i] - 1){
                        // Setting shared nodes between the current hexagon and the adjacent hexagon to the north east

                        // If the north most node of the hexagon has yet to be defined
                        // Sets the current hexagon's north node to the south west node of the hexagon that's adjacent to the north east
                        if(this.hexagons[i][j].getNode(NODE.NORTH) == undefined)
                            this.hexagons[i][j].setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH_WEST), NODE.NORTH);
                        // Sets the current hexagon's north east node to the south node of the hexagon that's adjacent to the north east
                        this.hexagons[i][j].setNode(this.hexagons[i - 1][j].getNode(NODE.SOUTH), NODE.NORTH_EAST);
                    }
                }
                // If not at the first column of hexagons in this row
                if(j != 0){
                    // Setting shared nodes between the current hexagon and the adjacent hexagon to the west
                    // If the north west node of the current hexagon is undefined
                    // Sets the current hexagon's north west node to be the north east node of the hexagon to the west
                    if(this.hexagons[i][j].getNode(NODE.NORTH_WEST) == undefined) 
                        this.hexagons[i][j].setNode(this.hexagons[i][j - 1].getNode(NODE.NORTH_EAST), NODE.NORTH_WEST);
                    // Sets the current hexagon's south west node be the the south east node of the hexagon to the west
                    this.hexagons[i][j].setNode(this.hexagons[i][j - 1].getNode(NODE.SOUTH_EAST), NODE.SOUTH_WEST);
                }

                // Loops through the remaining nodes of the hexagons and checks if they haven't been intialized and creates a node at the position around the hexagon
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    if(this.hexagons[i][j].getNode(k) == undefined) this.hexagons[i][j].setNode(new Node, k);
                }
                // Loops through all the nodes around the hexagon
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    // Adds the adjacent node that's 1 position back counterclockwise to the current node
                    this.hexagons[i][j].getNode(k).addAdjacentNode(this.hexagons[i][j].getNode((k + HEXAGON.NUM_OF_NODES - 1) % HEXAGON.NUM_OF_NODES));
                    // Adds the adjacent node that's 1 position forward clockwise to the current node
                    this.hexagons[i][j].getNode(k).addAdjacentNode(this.hexagons[i][j].getNode((k + 1) % HEXAGON.NUM_OF_NODES));
                }
            }
        }
        
        // Loops through all the rows after the middle row of the board
        for(let i = BOARD.INDEX_AFTER_MIDDLE; i < BOARD.NUM_OF_ROWS; i++){
            // Sets the current row to a new Array with a size of max num of hexagons of this row
            this.hexagons[i] = new Array(BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW);
            // Loops through all the hexagons in this row
            // Including an index of the board, as the hexagon columns beyond the middle row start counting from their row distance from the middle + 1
            for(let j = 0, index = i - BOARD.INDEX_AFTER_MIDDLE + 1; j < NUM_OF_HEXAGONS_PER_ROW[i]; j++, index++){
                // Gets a random resource that is still available
                let resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES);
                while(numOfResources[resourceNumber] <= 0){
                    resourceNumber = Math.floor(Math.random() * HEXAGON.NUM_OF_RESOURCES)
                } 
                // Removes 1 from that resource, as that resouce will now be used to generate a new hexagon
                numOfResources[resourceNumber]--;

                // Creates new variable that stores the token numebr of the hexagon
                let tokenNumber : number;
                // If the resource is the desert, sets the token number to 0, as you can't roll for the desert
                // Sets the robber position to the desert as the robber starts in the desert
                if(resourceNumber == HEXAGON.DESERT){
                    tokenNumber = 0;
                    this.robberPosition = [i, index];
                }
                // If it's not the desert, generates a random token number that is still available
                else{
                    // Generates a number from 0-10 as the only available dice numbers you can roll are 2-12, and there's 11 digits between 2 and 12 (inclusive)
                    tokenNumber = Math.floor(Math.random() * 11);
                    while(numOfRollNumber[tokenNumber] <= 0){
                        tokenNumber = Math.floor(Math.random() * 11);
                    }
                    // Removes 1 from that token numebr, as that token number we be used to generate a hexagon
                    numOfRollNumber[tokenNumber]--;
                    // Adds 2 to the token number as the lowest dice value is 2
                    tokenNumber += 2;
                }

                // Creates a new Hexagon at the row and column in the loop, with the resourceNumber, tokenNumber, and whether the resource of the hexagon is the desert (as robbers start in the desert)
                this.hexagons[i][index] = new Hexagon(resourceNumber, tokenNumber, resourceNumber == HEXAGON.DESERT);
                // Adds the hexagon to the rollHexagon array at the token number of the hexagon
                this.rollHexagon[tokenNumber].push(this.hexagons[i][index]);

                // Getting nodes from adjacent nodes
                // Always a adjacent hexagon in 3 north positions
                // Sets the node at north and north west to be the south and south east nodes of the adjacent hexagon to the north west
                this.hexagons[i][index].setNode(this.hexagons[i - 1][index - 1].getNode(NODE.SOUTH), NODE.NORTH_WEST);
                this.hexagons[i][index].setNode(this.hexagons[i - 1][index - 1].getNode(NODE.SOUTH_EAST), NODE.NORTH);
                // Sets the node at the north east to be the south node of the adjacent hexagon to the north east
                this.hexagons[i][index].setNode(this.hexagons[i - 1][index].getNode(NODE.SOUTH), NODE.NORTH_EAST);

                // If not at the first column of hexagons on this row
                // Sets the node of the south west to be the south east node of the adjacent node to the west
                if(j != 0) this.hexagons[i][index].setNode(this.hexagons[i][index - 1].getNode(NODE.SOUTH_EAST), NODE.SOUTH_WEST);
                
                // Loops through the remaining nodes of the hexagons and checks if they haven't been intialized and creates a node at the position around the hexagon
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    if(this.hexagons[i][index].getNode(k) == undefined) this.hexagons[i][index].setNode(new Node, k);
                }
                // Loops through all the nodes around the hexagon
                for(let k = 0; k < HEXAGON.NUM_OF_NODES; k++){
                    // Adds the adjacent node that's 1 position back counterclockwise to the current node
                    this.hexagons[i][index].getNode(k).addAdjacentNode(this.hexagons[i][index].getNode((k + HEXAGON.NUM_OF_NODES - 1) % HEXAGON.NUM_OF_NODES));
                    // Adds the adjacent node that's 1 position forward clockwise to the current node
                    this.hexagons[i][index].getNode(k).addAdjacentNode(this.hexagons[i][index].getNode((k + 1) % HEXAGON.NUM_OF_NODES));
                }
            }
        }

        // Array used for storing number of each harbour type left that will be distributed amongst the harbours on the board
        let numOfHarbours = [4, 1, 1, 1, 1, 1];
        // Loops through all the possible harbour locations on the board
        HARBOUR_LOC.forEach(element => {
            // Gets a random harbour type that is still available
            let harbourType = Math.floor(Math.random() * 6);
            while(numOfHarbours[harbourType] <= 0) {
                harbourType = Math.floor(Math.random() * 6);
            }
            // Removes from 1 from that harbour type,a s that harbour type will now be used towards the current harbour location that's being looped through
            numOfHarbours[harbourType]--;
            // Sets the nodes of the respective harbour location to include the harbour type that was randomly generated
            this.hexagons[element[0]][element[1]].getNode(element[2]).setHarbour(harbourType);
            this.hexagons[element[0]][element[1]].getNode(element[3]).setHarbour(harbourType);
        });
    }

    // Getter methods
    // Gets the resource type and token number of all the hexagons on the board
    getAllHexagons() : Array<Array<Array<number>>>{
        // Creates a new array that will store all the hexagons
        let returnArray = new Array(BOARD.NUM_OF_ROWS);
        // Loops through all the rows of the grid
        for(let i = 0; i < BOARD.NUM_OF_ROWS; i++){
            // Creates a new array for the current row in returnArray
            returnArray[i] = new Array(BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW);
            // Loops through all the hexagons in the current row
            for(let j = 0; j < BOARD.MAX_NUM_OF_HEXAGONS_PER_ROW; j++){
                // Sets the current row and column of the grid to be the values of the current hexagon (if they exist), or [-1, -1] if there's no hexagon at the current position
                returnArray[i][j] = (this.hexagons[i][j] == undefined) ? [-1, -1] : this.hexagons[i][j].getValues();
            }
        }
        // Returns the array of hexagon values
        return returnArray;
    }
    // Gets all the harbour types in the order of harbour locations from the top left to the bottom right 
    getAllHarbours() : Array<number> {
        // Array that stores all the harbour types
        let returnArray = new Array();
        // Loops through all the harbour locations available on the board
        HARBOUR_LOC.forEach(element => {
            // Gets the harbour type of one of the nodes specified at the harbour location, and adds it to the array of harbour types
            returnArray.push(this.hexagons[element[0]][element[1]].getNode(element[2]).getHarbour());
        });
        // Returns the array of harbour types
        return returnArray;
    }
    // Gets all the hexagons with a token number/dice roll
    getHexagonsByRoll(roll : number) : Array<Hexagon>{
        return this.rollHexagon[roll];
    }
    // Gets the hexagon specified at the row and column
    getHexagon(row : number, column : number) : Hexagon{
        return this.hexagons[row][column];
    }
    // Gets the longest path from a node of a user
    // Also has parameters for visitedSegments for road segments that have already been searched in the current search
    // firstSearch if the position at the current node is the first node to be searched
    getLongestPath(node : Node, user: number, visitedSegments : Map<Node, Map<Node, boolean>> = new Map(), firstSearch : boolean = true) : number{
        // Variable that stores the longest path from this node
        let length = 0;
        // Checks if the node isn't the starting node for this search and the current node is occupied by another user
        // Returns 0 as paths can be obstructed by other user's settlements
        if(!firstSearch && node.getUser() != -1 && node.getUser() != user) return 0;
        // If the map of visited segments does not contain the node, adds a map for that node to store whether or not that road segment has been visited
        if(!visitedSegments.has(node)) visitedSegments.set(node, new Map());
        // Loops through all the adjacent nodes of the current node
        for(let [adjNode, road] of node.getAdjacentNodes()){
            // Checks if road that connects that an adjacent node does not belong to the user, or if the road has already been traversed for the search
            if(road != user || visitedSegments.get(node).get(adjNode)) continue;

            // Sets the road from the current node to the adjacent node to true, as the road will be traversed
            visitedSegments.get(node).set(adjNode, true);
            // If the adjacent node does not exist on the map of visitedSegments, adds a map for the adjacent node
            if(!visitedSegments.has(adjNode)) visitedSegments.set(adjNode, new Map());
            // Sets the road from the adjacent node to the current node to true, as the road will be traversed
            visitedSegments.get(adjNode).set(node, true);
            
            // Gets the longest path from the adjacent node, if the road from the current node and the adjacent node is traversed
            let tempLength = this.getLongestPath(adjNode, user, visitedSegments, false) + 1;
            // Compares the currently known longest path, and the longest path from the adjacent node, and gets the max value
            length = Math.max(length, tempLength);

            // Sets the road to the adjacent node as not traversed as it can be cleared for future search
            visitedSegments.get(node).set(adjNode, false);
            visitedSegments.get(adjNode).set(node, false);
        }
        // Returns the longest path found
        return length;
    }
    // Gets the robber's position
    getRobberPosition() : Array<number>{
        return this.robberPosition;
    }

    // Method for moving the robber to a new specified position
    // Returning true if the move is valid and false if it isn't
    // Has parameters for the position as an array with row and column
    moveRobber(position : Array<number>) : boolean{
        // Gets the hexagon at the specified position
        let hexagon = this.getHexagon(position[0], position[1]);
        // If the hexagon is undefined, not a valid position and returns false
        if(hexagon == undefined) return false;
        // If the hexagon already contains the robber, not a valid position and returns false
        if(hexagon.getRobber()) return false;
        // Gets the position with the robber and sets the robber to false (method sets robber value to opposite value)
        this.getHexagon(this.robberPosition[0], this.robberPosition[1]).setRobber();
        // Makes a shallow copy of the position and stores the position as the new robberPosition
        this.robberPosition = [...position];
        // Sets the hexagon specified to include the robber
        hexagon.setRobber();
        // Returns true as the position is valid
        return true;
    }
    // Method for checking if a road between 2 nodes will cause a collision or is just not possible
    // Has parameters for the position as a 2d array, containing the node positions of both ends of the road (with node positions as the hexagon row, hexagon column, and the position on the hexagon)
    collisionRoad(position : Array<Array<number>>) : boolean{
        // Gets the hexagons that's attached the both the nodes
        let hexagons = [this.getHexagon(position[0][0], position[0][1]), this.getHexagon(position[1][0], position[1][1])];
        // If the hexagon positions are invalid, returns true
        if(hexagons[0] == undefined || hexagons[1] == undefined){
            return true;
        }
        // Gets the nodes from their positions on their respective hexagons
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
        // Checks if one of the nodes does not contain the other node as an adjacent node, or if the path between the 2 nodes are already occupied, or if the nodes are the same
        if(!node[0].getAdjacentNodes().has(node[1]) || node[0].getAdjacentNodes().get(node[1]) != -1 || node[0] == node[1]){
            // Returns true as the road is not possible
            return true;
        }
        // Returns false as the road is clear
        return false;
    }
    // Method for checking if a road is valid and can be connected to the user's network of roads
    // Has parameters for the nodes that the user is connected to and the position of the 2 nodes (with node positions as the hexagon row, hexagon column, and the position on their hexagon)
    validRoad(userNodes : Set<Node>, position : Array<Array<number>>) : boolean {
        // Checks if the road is valid in the first place, and if it causes a collision or isn't possible, returns false
        if(this.collisionRoad(position)) return false;
        // Gets the 2 nodes of the road using the hexagons their attatched to, and the position on the hexagon
        let hexagons = [this.getHexagon(position[0][0], position[0][1]), this.getHexagon(position[1][0], position[1][1])];
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
        // Checks if the user at least contains one of the nodes in their network of nodes they're connected to
        return (userNodes.has(node[0]) || userNodes.has(node[1]));
    }
    // Method for adding a road to the board
    // Has parameters for the position of the 2 nodes of the road, and the user's number in the game
    addRoad(position : Array<Array<number>>, user : number) : void{
        // Gets the 2 nodes position by getting the hexagons their attatched to, and the position on their respective hexagons
        let hexagons = [this.getHexagon(position[0][0], position[0][1]), this.getHexagon(position[1][0], position[1][1])];
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
        // Gets their adjacentHexagons, and sets the other node's value to the user's value as a road
        node[0].getAdjacentNodes().set(node[1], user);
        node[1].getAdjacentNodes().set(node[0], user);
    }
    // Method for checking if a settlement location is valid
    // Has parameters for the node position, and if it's the earlyGame (where settlements can be placed anywhere in the first 2 rounds), and the nodes that the user is connected to
    validSettlement(position : Array<number>, earlyGame : boolean = true, userNodes : Set<Node> = new Set()) : boolean{
        // Gets the hexagon that's attatched to that node
        let hexagon = this.getHexagon(position[0], position[1]);
        // If that hexagon isn't valid, returns false, as the position is invalid
        if(hexagon == undefined) return false;
        // Gets the node by getting node at the position around the hexagon specified
        let node = hexagon.getNode(position[2]);
        // Checks if the node is already preoccupied and returns false if it is
        if(node.getUser() != -1) return false;

        // Loops through all the adjacentNodes, and checking if the nodes adjacent to the current node are preoccupied (as you cannot settle within 1 node of other settlements)
        for(let [adjNode, road] of node.getAdjacentNodes()){
            // If an adjacent node is preoccupied, returns false
            if(adjNode.getUser() != -1) return false;
        }

        // If it's not the early game and the user does not have the node in it's network of roads, then returns false
        if(!earlyGame && !userNodes.has(node)) return false;
        // Returns true as it passed all the tests
        return true;
    }
    // Method for adding a settlement onto the board
    // Has parameters for the node position, and the user's number
    // Returns the harbour type of the new settlement
    addSettlement(position : Array<number>, user:number) : number{
        // Gets the node according to it's hexagon position and the position around the hexagon
        let hexagon = this.getHexagon(position[0], position[1]);
        let node = hexagon.getNode(position[2]);
        // Sets that node to be the user's number
        node.setUser(user);
        // Sets the type to 1 to signify a standard settlemetn
        node.setType(1);
        // Retuns the harbour type of that node
        return node.getHarbour();
    }
    // Method for checking if another user's road breaks if a settlement is placed at that location, and gets the user that gets the road broken
    // Has parameters for the current user's number, and the node position of the settlement
    breaksRoad(user : number, position : Array<number>) : number{
        // Gets the node according to it's hexagon position and the position around the hexagon
        let hexagon = this.getHexagon(position[0], position[1]);
        let node = hexagon.getNode(position[2]);
        // Variable that stores the other known road that doesn't belong to the user and is connected to the current node
        let knownRoad = -1;
        // Loops through all the adjacent nodes of the current node
        for(let [adjNode, road] of node.getAdjacentNodes()){
            // Checks if the adjacent road isn't occupied and returns -1, as there will be no break in the road
            if(road == -1) return -1;
            // Checks if the road to the adjacent node doesn't belong to the current user
            if(road != user){
                // If there hasn't been another road that has been found, store the user that owns the road
                if(knownRoad == -1) knownRoad = road;
                // If another road has been found, and the user that owns it also owns the other road that connects to this road, return the user's number
                else if(knownRoad == road) return road;
                // Returns -1 as there are different users that connect to this road
                else return -1;
            }
        }
        // Returns -1 as last resort if no other user has been found to connect to the current node
        return -1;
    }
}