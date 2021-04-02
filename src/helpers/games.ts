// games.ts
// Gordon Lin
// Contains class for the main game, and operations and interactions with the game, as well as class for mapping the different games according to their gamekeys

// Import external module
import { v4 as uuidv4 } from 'uuid';

// Import Board, Node, and Client classes/modules from other files
import { Board, Node } from './board';
import { Client } from './clients';

// Enumerator that stores the minimum and max number of players in a game
enum GameConst{
    MAX_PLAYERS = 4,
    MIN_PLAYERS = 3
}

// Interface which stores information about the user in the game
// Stores their connection Client information, the number of each resources they have in the game, the number of victory points they have, the nodes they're connected to,
// if they're connected to each type of harbour, the number of each type of card they have, and the number of each game piece they have remaining
interface gamePlayer {
    client : Client,
    resources : Array<number>,
    victoryPoints : number,
    nodes : Set<Node>,
    harbour : Array<boolean>,
    cards : Array<number>,
    pieces : Array<number>
}

// Function used to shuffle up an array, which takes in an array of any value
function shuffle(array : Array<any>){
    // Variables which store the current index of the array to randomize, a temporary variable to store the contents at the index, and a variable for a random number
    let currentIndex = array.length, temp : any, random : number;
    // While loop while the current index isn't 0
    while(0 != currentIndex){
        // Gets a random position in the array up to the current index being checked
        random = Math.floor(Math.random() * currentIndex);
        // Decremenets one from the currentIndex
        currentIndex--;
        // Sets the temporary value as the value at the value at the currentIndex in the array
        temp = array[currentIndex];
        // Swaps the value between currentIndex and at the random value index
        array[currentIndex] = array[random];
        array[random] = temp;
    }
    // Returns the shuffled array
    return array;
}

// Function used to check if a variable is an array and all contains one type
// Takes in the variable as input, and the type
function isTypeArray(input : any, type : String) : boolean{
    // Checks if the input isn't an array, and returns false
    if(!(input instanceof Array)) return false;
    // Loops through each value in the array and checks if the value isn't the type, and returns false if it isn't
    for(let i of input){
        if(typeof i != type) return false;
    }
    // Returns true as the array passed all the tests
    return true;
}

// Class which stores and operates and calculates the actual game
class Game{
    // Array which stores all the users of the game
    private users : Array<gamePlayer>;
    // Variable that will store the board of the game
    private board : Board;

    // Variable that stores if the game is started
    private gameStarted : boolean;
    // Variable that stores the gameKey of the current game
    private gameKey : string;
    // Variable that stores the guid of the gameOwner
    private gameOwner : string;
    
    // Variable that stores the current turn number
    private currentTurn : number;
    // Variable that stores the round type of the game (0 and 1 being early game, 2 being the actual game)
    private roundType : number;
    // Variable that stores whether or not the user just rolled the dice this turn
    private justRolled : boolean;

    // Array that stores the number of remaining cards for each type of card
    private numOfRemainingCards : Array<number>;
    // Array that stores the total number of cards each user has
    private numOfCardsUsers : Array<number>;
    // Array that stores the total number of resources each user has
    private numOfResources : Array<number>;
    // Array that stores the number of resources each user has to forfeit when a 7 is rolled
    private numForfeit : Array<number>;

    // Array that stores each user's longest road length
    private longestRoads : Array<number>;
    // Array that stores the number of knights each user has played
    private knights : Array<number>;
    
    // Array that stores the number of victory points each user publically displays
    private publicVictoryPoints : Array<number>;
    
    // Array that stores whether or not the robber can be moved
    private moveRobber : boolean;
    // Array that stores the players a user can rob when moving the robber
    private validRobberies : Set<number>;
    
    // Array that stores resources being requested and sent for the current active trade between users
    private currentTrade : Array<Array<number>>;
    // Array that stores the trade response for each user
    private tradeUser : Array<number>;

    // Variable that stores whether or not a card has been played this turn
    private cardPlayed : boolean;
    // Array that stores whether a player can play each card type
    private cantPlayCard : Array<boolean>;

    // Variable that stores which user has the current longest road
    private currentLongestRoad : number;
    // Variable that stores which user has the current larger army
    private currentLargestArmy : number;

    // Constructor for the game, which takes in the creator of the game's guid, and the game key
    constructor(gameOwner : string, gameKey : string){
        // Creates a new array for the users
        this.users = new Array();
        // Sets the gamekey to the gamekey and gameowner to the gameowner's guid
        this.gameKey = gameKey;
        this.gameOwner = gameOwner;
        // Calls init method to initalize all the variables for the start of the game
        this.init();
    }

    // Method which intializes all the variables back to default values
    init() : void{
        // Sets the board to a new Board object
        this.board = new Board();

        // Sets the gameStarted to false
        this.gameStarted = false;
        // Sets the currentTurn to be 0 and roundType to 0 as the first player goes first
        this.currentTurn = 0;
        this.roundType = 0;
        
        // Sets justRolled to false, as the dice has yet to be rolled
        this.justRolled = false;

        // Sets moveRobber to false, as the robber doesn't move at the beginning of the game
        this.moveRobber = false;
        
        // Sets cardPlayed to false, as a card has yet to be played
        this.cardPlayed = false;
        // Initializes the number of remaining cards as follows
        // 14 knights cards
        // 5 victory point cards 
        // 2 monopoly cards 
        // 2 year of plenty cards
        // 2 road building cards
        this.numOfRemainingCards = [14, 5, 2, 2, 2];
        // Initializes the number of cards for each player to 0 as players start with nothing
        this.numOfCardsUsers = [0, 0, 0, 0];
        // Set cantPlayCard to undefined, as no card has been picked up and is pointless right now
        this.cantPlayCard = undefined;

        // Initializes arrays regarind player data to 0, as each player starts with nothing
        this.publicVictoryPoints = [0, 0, 0, 0];
        this.knights = [0, 0, 0, 0];
        this.longestRoads = [0, 0, 0, 0];
        this.numOfResources = [0, 0, 0, 0];
        this.numForfeit = [0, 0, 0, 0];
        
        // Initializes the currentTrade status as undefined, as there are no trades occuring
        this.currentTrade = undefined;
        this.tradeUser = undefined;
        
        // Initializes the current largest army and current longest road as -1, as no user has roads or an army
        this.currentLargestArmy = -1;
        this.currentLongestRoad = -1;

        // Initializes an empty set for valid robberies
        this.validRobberies = new Set();
    }

    // Gets the gameKey for this game
    getKey() : string{
        return this.gameKey;
    }
    // Gets the array of users that have joined the game
    getUsers() : Array<gamePlayer> {
        return this.users;
    }
    // Resets all the user data back to default values
    clearUserData() : void {
        // Loops through all the users
        this.users.forEach(user => {
            // Fills the number of resources they have to 0
            user.resources.fill(0);
            // Sets their victory points back to 0
            user.victoryPoints = 0;
            // Sets all their harbours back to false
            user.harbour.fill(false);
            // Clears all the nodes they have connected
            user.nodes.clear();
            // Sets all their cards back to 0
            user.cards.fill(0);
            // Sets their pieces back to the alloted amount of pieces for each player
            // 15 roads
            // 5 settlements
            // 4 cities
            user.pieces = [15, 5, 4];
        });
    }
    // Removes the user from the game, which takes in the user to remove
    removeUser(user : Client) : void {
        // Loops through all the users that have joined the game
        for(let i = this.users.length - 1; i >= 0; i--){
            // Checks if the current index at users at the index matches the user
            if(this.users[i].client == user){
                // Removes the user
                this.users.splice(i, 1);
                break;
            }
        }
        // Broadcasts to other user that the user has disconnected from the game
        this.broadcastToUsers({
            "message" : `${user.name} has left the game`
        });
    }
    // Method that closes the game and forces all the users to leave
    gameClosed() : void {
        // Broadcasts to users that the owner left the game
        this.broadcastToUsers({
            "message" : "Owner left game, shutting down"
        });
        // Sets each user's joinedGame to undefined, making them not have a game assigned to them
        this.users.forEach(user => {
            user.client.joinedGame = undefined;
        });
    };
    // Method that prematurely ends the game, and resets all the values
    endPreamturely() : void {
        // Broadcasts to all user that the game has ended prematurely
        this.broadcastToUsers({
            "game" : "endPremature"
        });
        // Calls init and clearUserData method to reset all values back to default
        this.init();
        this.clearUserData();
    }
    // Method which checks for each if they've won the game
    checkForWinner() : void {
        // Loops through each user 
        for(let i = 0; i < this.users.length; i++){
            // Checks if the number of victory points for this user is greater or equal to 10
            if(this.users[i].victoryPoints >= 10) {
                // Broadcasts to all the users that the game is over and who the winner
                this.broadcastToUsers({
                    "game" : "end",
                    "winner" : i
                });
                // Calls init and clearUserData method to reset all values back to default
                this.init();
                this.clearUserData();
                // Exits method
                return;
            }
        }
    }
    // Checks if a user is the owner of the game, given a guid
    isGameOwner(userId : string) : boolean {
        return userId === this.gameOwner;
    }
    // Gets if the game has started
    isGameStarted() : boolean {
        return this.gameStarted;
    }
    // Gets if the it's currently the user's turn, by checking if the client of current user's turn matches the parameter
    isUserTurn(user : Client) : boolean {
        return this.users[this.currentTurn].client == user;
    }
    // Method that broadcasts a JSON to all the users of the game
    broadcastToUsers(json : any){
        // Loops through each of the users
        this.users.forEach(user => {
            // Sends a message to the users with the json specified
            user.client.connnection.send(JSON.stringify(json));
        });
    }
    // Method that broadcasts individualized game info to all the users
    broadcastGameInfo(json = {}){
        // Loops through all the users in the game
        this.users.forEach(user => {
            // Sends out the following data about to the user
            // - Player's resources
            // - Player's cards
            // - Number of victory points of plyaer
            // - Which harbours the player has access to
            // - How many pieces the player has left
            // - The number of public victory points for each each
            // - The total number of resources for each user
            // - The total number of cards for each user
            // - The longest roads for each user
            // - The number of knights played for each user
            // - The user with the longest road
            // - The user with the largest army
            // Also sends out any additional information specified
            user.client.connnection.send(JSON.stringify(Object.assign({
                "resources" : user.resources,
                "cards" : user.cards,
                "victoryPoints" : user.victoryPoints,
                "harbour" : user.harbour,
                "pieces" : user.pieces,
                "victoryPointsAllUsers" : this.publicVictoryPoints,
                "resourcesAllUsers" : this.numOfResources,
                "cardsAllUsers" : this.numOfCardsUsers,
                "longestRoads" : this.longestRoads,
                "knights" : this.knights,
                "userLongestRoad" : this.currentLongestRoad,
                "userLargestArmy" : this.currentLargestArmy
            }, json)));
        })
    }
    // Method that starts the game and returns whether the game can be started or not
    startGame() : boolean{
        // Checks if there isn't enough users to start the game, and returns false if there isn't enough
        if(this.users.length < GameConst.MIN_PLAYERS) return false;
        // Shuffles all the users
        shuffle(this.users);
        // Loops through all the users in the game
        for(let i = 0; i < this.users.length; i++){
            // Sends out the data about the start of the game for each user
            // - Tells the user about each the board (hexagons and harbours)
            // - Tells what turn the user will play
            // - Tells how many users are in the game
            this.users[i].client.connnection.send(JSON.stringify({
                "game" : "started",
                "hexagons" : this.board.getAllHexagons(),
                "harbours" : this.board.getAllHarbours(),
                "turn" : i,
                "numOfUsers" : this.users.length 
            }));
        }
        // Sets gameStarted to true and returns the value
        return this.gameStarted = true;
    }

    // Method that joins the user to the game and returns whether or not the user has join or not
    joinGame(user : Client) : boolean {
        // Checks if the number of users is equal to or greater than the max players as there's already max amount of users
        if(this.users.length >= GameConst.MAX_PLAYERS) return false;
        // Broadcasts to all other users that the player has joined the game
        this.broadcastToUsers({
            "message" : `${user.name} has joined the game`
        });
        // Adds the user to array of users with
        // - The Client interface
        // - The number of each type of resources this player has (initially 0)
        // - The number of victory points this user has
        // - The nodes that user is connected to
        // - The harbours that the user is connected to
        // - The number of each type of card this player has (initially 0)
        // - The number of pieces the user has to play (15 roads, 5 settlements, 4 cities)
        this.users.push({
            client : user,
            resources : [0, 0, 0, 0, 0],
            victoryPoints : 0,
            nodes : new Set(),
            harbour : [false, false, false, false, false, false],
            cards : [0, 0, 0, 0, 0],
            pieces : [15, 5, 4]
        });
        // Sets the user's joinedGame to the game's gamekey
        user.joinedGame = this.gameKey;
        return true;
    }
    
    // Method that ends the turn of the game, taking in the user's client, and the errorCallback
    endTurn(user : Client, errorCallback : (ws : any, message : string) => any) : void {
        // Checks if it's the user's turn, and if not, sends error callback saying that it's not the user's turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        // If it's the first round of early game
        if(this.roundType == 0){
            // If the currentTurn has reached the end of the users, moves onto the next round of the early game
            if(this.currentTurn == this.users.length - 1) this.roundType++;
            // Else if currentTurn has not reached the end of the users, increments the currentTurn
            else this.currentTurn++;
        }
        // If it's the second round of early game
        else if(this.roundType == 1){
            // If the current reached has reached the start again, moves onto the next round type (actual game)
            if(this.currentTurn == 0) this.roundType++;
            // Else if currentTurn has not reached the beginning, decrements currentTurn
            else this.currentTurn--;
        }
        // Else if it's the actual game
        else{
            // Increments 1 to the currentTurn, and modulos the length to wrap back to the beginning of user
            this.currentTurn = (this.currentTurn + 1) % this.users.length;
        }
        
        // Sets card information back to default, so the next user can play their cards
        this.cantPlayCard = undefined;
        this.cardPlayed = false;

        // Sets justRolled to false, as the user has yet to roll in the next turn
        this.justRolled = false;

        // Resets trades for the next turn, as the turn is ending for this user
        this.currentTrade = undefined;
        this.tradeUser = undefined;

        // Tells the user about the end of the turn, with the new currenTurn value and new roundType value
        this.broadcastGameInfo({
            "game" : "turn end",
            "turn" : this.currentTurn,
            "round" : this.roundType
        });
    }

    // Method for robbing other users after moving a robber
    // Takes in values for the current user, the number of the user being robbed, and errorCallback
    rob(user : Client, robbedPlayer : number, errorCallback : (ws : any, message : string) => any) : void{
        // Checks if it's not the user's turn, and if not, tells the user that it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        // Checks if there are no valid robberies, and sends out an error saying there are no robberies available
        if(this.validRobberies.size == 0){
            errorCallback(user.connnection, "Not valid move");
            return;
        }
        // Checks if the other user is in the set of validRobbers, if not, sends out an error saying that the user can't be robbed
        if(!this.validRobberies.has(robbedPlayer)){
            errorCallback(user.connnection, "Not a valid player");
            return;
        }
        // Gets a random resource that the robbed user has
        let resource = Math.floor(Math.random() * 5);
        while(this.users[robbedPlayer].resources[resource] == 0){
            resource = Math.floor(Math.random() * 5);
        }
        // Decrements the number of that resource and total number of resources from the robbed user
        this.users[robbedPlayer].resources[resource]--;
        this.numOfResources[robbedPlayer]--;
        // Increment the number of that resource and total number of resources from the current user
        this.users[this.currentTurn].resources[resource]++;
        this.numOfResources[this.currentTurn]++;
        // Sends out game info about the robbery, and the position of the robber
        this.broadcastGameInfo({"game" : "robbery", "robber" : this.board.getRobberPosition()});
        // Resets validRobbers to an empty set
        this.validRobberies = new Set();
    }

    // Method for moving the robber
    // Taking in the user, the new position of the robber, and the errorCallback, and whether or not a card was played to move the robber
    // Returns whether or not the robber can be moved
    robberMove(user : Client, position : Array<number>, errorCallback : (ws : any, message : string) => any, cardPlayed : boolean = false) : boolean{
        // Checks if it's the user's turn, and if it's not, sends error back to the user saying it's not the user's turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }
        // Checks if you can't move the robber and a card wasn't played to move the robber, and sends error back to the user saying that it's not a valid turn
        if(this.moveRobber == false && !cardPlayed){
            errorCallback(user.connnection, "Not valid move");
            return false;
        }
        
        // Calls moveRobber method with the new position to see if the robber can be moved to that location
        if(this.board.moveRobber(position)){
            // Sets validRobberies to an empty set
            this.validRobberies = new Set();

            // Loops through all the nodes around the hexagon and gets all the users that have settled around the node, and checks if the user isn't the current turn, and the user has resources
            // If so, adds the user to the set of validRobberies
            this.board.getHexagon(position[0], position[1]).getAllNodes().forEach(node => {
                if(node.getUser() != -1 && node.getUser() != this.currentTurn && this.numOfResources[node.getUser()] > 0) this.validRobberies.add(node.getUser());
            });
            
            // Sets moveRobber to false as the robber has been moved
            this.moveRobber = false;

            // If there's no available players to rob from, just sends the robber position
            if(this.validRobberies.size == 0) {
                this.broadcastGameInfo({"game" : "robbery", "robber" : position});
                return;
            }
            // If there's only one available players to rob from
            else if(this.validRobberies.size == 1){
                // Gets the user value of the only player to rob from
                let val = this.validRobberies.values().next().value;
                // Gets a random resource that the user has
                let resource = Math.floor(Math.random() * 5);
                while(this.users[val].resources[resource] == 0){
                    resource = Math.floor(Math.random() * 5);
                }

                // Decrements the number of that resource and total number of resources from the robbed user
                this.users[val].resources[resource]--;
                this.numOfResources[val]--;
                // Increment the number of that resource and total number of resources from the current user
                this.users[this.currentTurn].resources[resource]++;
                this.numOfResources[this.currentTurn]++;
                // Sends out game info about the robbery, and the position of the robber
                this.broadcastGameInfo({"game" : "robbery", "robber" : position});
                // Resets validRobbers to an empty set
                this.validRobberies = new Set();
            }
            // If there's more than one avaialble players to rob from
            else{
                // Sends out the which users the current user can rob from
                user.connnection.send(JSON.stringify({
                    "game" : "rob",
                    "users" : Array.from(this.validRobberies)
                }));
            }
            return true;
        }
        else{
            // Tells that the position is invalid and the robber couldn't move the position specified
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }
    }

    // Method that loops through all the users to get the number of resources each user has to forfeit when a 7 has been rolled
    robberForfeit() : void{
        // Loops through all the players, checks if the number of resources that user has is >= 8
        for(let i = 0; i < this.users.length; i++){
            if(this.numOfResources[i] >= 8){
                // Gets half the number of resources the user has and tells the user to forfeit that amount of resources
                this.numForfeit[i] = Math.floor(this.numOfResources[i] / 2);
                this.users[i].client.connnection.send(JSON.stringify({
                    "game" : "forfeit",
                    "numberForfeit" : this.numForfeit[i]
                }));
            }
            else{
                // Sets number of resources to forfeit to 0, as the user has < 8 resources
                this.numForfeit[i] = 0;
            }
        }
        // If all the number of resources to forfeit is 0
        if(this.numForfeit.every(num => num == 0)){
            // Tells the user who rolled a 7 to move the robber
            this.moveRobber = true;
            this.users[this.currentTurn].client.connnection.send(JSON.stringify({
                "game" : "move robber"
            }));
        }
    }

    // Method used to forfeit a number of resources when a user has rolled a 7
    // Takes in the user forfeiting, the number of each resource to forfeit, and the errorCallback
    forfeit(user : Client, resources : Array<number>, errorCallback : (ws : any, message : string) => any) : void {
        // Loops through all the users
        for(let i = 0; i < this.users.length; i++){
            // If the current user at the index equals the user calling the method
            if(this.users[i].client == user){
                // Checks if the number of resources being forfeitted doesn't equal the number of resources that need to be fforfeitted
                if(resources.reduce((a, b) => a + b) != this.numForfeit[i]){
                    // Tells the user that the number isn't valid
                    errorCallback(user.connnection, "Invalid amount of resources");
                    return;
                }
                // Loops through all the resources and checks if the user has enough of each of those resources
                // If not, tells the user that they do not have enough resources
                for(let j = 0; j < 5; j++){
                    if(resources[j] > this.users[i].resources[j]){
                        errorCallback(user.connnection, "Invalid amount of resources");
                        return;
                    }
                }
                // Loops through all the resources and decrements the number of resources that the user told to remove
                for(let j = 0; j < 5; j++) this.users[i].resources[j] -= resources[j];
                // Remove the number of resources forfeitted from the user's total number of resources
                this.numOfResources[i] -= this.numForfeit[i];
                // Sets the number resources to forfeit this user to 0
                this.numForfeit[i] = 0;
                // Broadcasts the info for all the game users
                this.broadcastGameInfo();
                break;
            }
        }
        // If every numebr in number of resources to forfeit is 0
        if(this.numForfeit.every(num => num == 0)){
            // Sets it possible to move the robber and tells the user to move the robber
            this.moveRobber = true;
            this.users[this.currentTurn].client.connnection.send(JSON.stringify({
                "game" : "move robber"
            }));
        }
    }
    
    // Method that updates which player has the longest road
    updateLongestPath() : void {
        // Stores which user has the longest road
        let user = -1
        // Stores the longest road
        let longest = 0;
        // Stores the number of users that have the same number of road
        let numberOfUsers = 0;
        // Loops through all the users
        for(let i = 0; i < this.users.length; i++){
            // Checks if the user's length is >= 5 (minimum length for longest road)
            if(this.longestRoads[i] >= 5){
                // If the road is longer than the last known longest road, sets the user to the current user, numberOfUsers to 1, and sets the longest road to the user's longest road
                if(longest < this.longestRoads[i]){
                    numberOfUsers = 1;
                    user = i;
                    longest = this.longestRoads[i];
                }
                // If the road is equal to the last known longest road, increments the number of users that have that length of road
                else if(longest == this.longestRoads[i]){
                    numberOfUsers++;
                }
            }
        }
        // If the number of users that have the longest road is 1
        if(numberOfUsers == 1){
            // If there was previous longest road, remove their victory points
            if(this.currentLongestRoad != -1){
                this.users[this.currentLongestRoad].victoryPoints-=2;
                this.publicVictoryPoints[this.currentLongestRoad]-=2;
            }
            // Sets the longest road the current user, and add 2 victory points to the user
            this.currentLongestRoad = user;
            this.users[this.currentLongestRoad].victoryPoints += 2;
            this.publicVictoryPoints[this.currentLongestRoad] += 2;
        }
        // Else if the numebr of users is greater than 1, and the previously known longest road is shorter than the current longest road, or the number of users with the longest road is 0
        else if((numberOfUsers > 1 && this.longestRoads[this.currentLongestRoad] < longest) || numberOfUsers == 0){
            // if there was a previous longest road, remove their victory points
            if(this.currentLongestRoad != -1){
                this.users[this.currentLongestRoad].victoryPoints-=2;
                this.publicVictoryPoints[this.currentLongestRoad]-=2;
            }
            // Sets longest road to -1
            this.currentLongestRoad = -1;
        }
    }

    // Method that finds the longest path for the user
    // Takes the in the number of the user
    findLongestPathUser(user : number) : void{
        // Variable that stores the longest road of the user
        let longest = 0;
        // Loops through all the nodes the user is connected to
        this.users[user].nodes.forEach(node => {
            // Find the longest path from that node
            let longestStartingFromNode = this.board.getLongestPath(node, user);
            // Updates the longest road if the longest road is larger
            if(longestStartingFromNode > longest) longest = longestStartingFromNode;
        });
        // Sets the user's longest path to known longest path
        this.longestRoads[user] = longest;
        // Update who has the longest path
        this.updateLongestPath();
    }

    // Method that gives resources to users when dice is rolled
    rollResources(roll : number) : void{
        // Loops through all the hexagons by the roll number
        this.board.getHexagonsByRoll(roll).forEach(hexagon => {
            // If the hexagon in question has a robber, skips the current hexagon
            if(hexagon.getRobber()) return;
            // Loops through all the nodes surrounding the hexagon, and if there's a user, it increments the number of the hexagon's resource for the specified user (1 for a normal settlement, 2 for a city)
            hexagon.getAllNodes().forEach(node => {
                if(node.getUser() == -1) return;
                this.users[node.getUser()].resources[hexagon.getResource() - 1] += node.getType();
                this.numOfResources[node.getUser()] += node.getType();
            });
        });
        // Broadcasts the game info with resources
        this.broadcastGameInfo({"game" : "resources"});
    }

    // Method that rolls the dice, taking in the user, and errorCallback
    rollDice(user : Client, errorCallback : (ws : any, message : string) => any) : void {
        // Checks if it's the proper turn type (2), if not, tells user that it's not the right turn type
        if(this.roundType != 2){
            errorCallback(user.connnection, "Not correct round type");
            return;
        }
        // Checks if it's the user's turn, if not, tells user it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        // Checks if the user already rolled, if so, tells the user they've already rolled this turn
        if(this.justRolled){
            errorCallback(user.connnection, "Already rolled dice this turn");
            return;
        }

        // Randomly generates a number from 2-12;
        const dice = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
        // Sets just rolled to true and tells all the users what number was rolled
        this.justRolled = true;
        this.users.forEach(element => {
            element.client.connnection.send(JSON.stringify({
                "game" : "roll",
                "dice" : dice
            }));
        });

        // If the dice rolled resulted in a 7, tells the user about moving the robber, else, calls rollResources to distribute resources
        if(dice == 7){
            this.robberForfeit();
        }
        else{
            this.rollResources(dice);
        }
    }

    // Method for adding a settlement, with user, position of the settlement, and errorCallback
    // Returns whether or not the settlement can be added
    addSettlement(user : Client, position : Array<number>, errorCallback : (ws : any, message : string) => any) : boolean{
        // Checks if the turn is 2 and the user has rolled the dice, if not, tells the user it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        // If it's not the user's turn, tells the user it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }

        // If the user doesn't have enough pieces to place a settlement, tells the user they do not have enough pieces
        if(this.users[this.currentTurn].pieces[1] == 0){
            errorCallback(user.connnection, "Not enough pieces");
            return false;
        }

        // Gets their resources, and checks if they have enough resources (1 grain, 1 lumber, 1 wool, and 1 brick), if not, tells the user they do not have enough resources
        let resources = this.users[this.currentTurn].resources;      
        if(resources[0] == 0 || resources[1] == 0 || resources[2] == 0 || resources[4] == 0){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }
        
        // Checks if the position for the settlement is valid, if not, tells the user that the position is invalid
        if(!this.board.validSettlement(position, false, this.users[this.currentTurn].nodes)){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }
        
        // Removes the resources from the user
        resources[0]--, resources[1]--, resources[2]--, resources[4]--;
        this.numOfResources[this.currentTurn] -= 4;

        // Gets if there's a break in the road when settling in this position, and the number of the user that gets their road broken
        let otherUser = this.board.breaksRoad(this.currentTurn, position);
        
        // Adds settlement, and gets the harbour value if there's a harbour
        let harbour = this.board.addSettlement(position, this.currentTurn);
        
        // Checks if there's a harbour connected, and sets the harbour to true
        if(harbour != -1){
            this.users[this.currentTurn].harbour[harbour] = true;
        }

        // Checks if there's another user that gets their road broken by the settlement, and finds the longest path of that user
        if(otherUser != -1){
            this.findLongestPathUser(otherUser);
        }

        // Adds 1 to the number of victory points to that user
        this.users[this.currentTurn].victoryPoints++;
        this.publicVictoryPoints[this.currentTurn]++;
        // Decrements a settlement piece
        this.users[this.currentTurn].pieces[1]--;

        // Broadcast the new settlement to all the players
        this.broadcastGameInfo({
            "game" : "settlement",
            "user" : this.currentTurn,
            "position" : position
        });

        // Checks for a winner
        this.checkForWinner();

        return true;
    }

    // Method to upgrade a settlement, with user, position of the settlement, and errorCallback
    // Returns whether or not the settlement is upgraded
    upgradeSettlement(user : Client, position : Array<number>, errorCallback : (ws : any, message : string) => any) : boolean{
        // Checks if it's the proper roundtype and the user has rolled, if not, tells the user it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        // Checks if it's the user's turn, if not, tells the user it's not the user's turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }
        
        // Checks if the user has a piece to place a city, if not, tells the user that there's not enough resources
        if(this.users[this.currentTurn].pieces[2] == 0){
            errorCallback(user.connnection, "Not enough pieces");
            return false;
        }

        // Checks if the user has enough resources to place a city, if not, tells the user there's not enough resources
        if(this.users[this.currentTurn].resources[3] < 3 || this.users[this.currentTurn].resources[0] < 2){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }

        // Gets the hexagon adjacent to the node and checks if the position is valid, if not, tells the user the position is invalid
        let hexagon = this.board.getHexagon(position[0], position[1]);
        if(hexagon == undefined){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }
        // Gets the node of the settlement, and checks if the node isn't the same as the user's, tells the user that the position is invalid
        let node = hexagon.getNode(position[2]);
        if(node.getUser() != this.currentTurn){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }

        // Removes the resources from the user to upgrade settlement
        this.users[this.currentTurn].resources[3] -= 3;
        this.users[this.currentTurn].resources[0] -= 2;
        this.numOfResources[this.currentTurn] -= 5;

        // Sets that settlement to become a city
        node.setType(2);
        
        // Increments victory points for the user
        this.users[this.currentTurn].victoryPoints++;
        this.publicVictoryPoints[this.currentTurn]++;
        
        // Removes a city piece, but adds back a settlement piece
        this.users[this.currentTurn].pieces[1]++;
        this.users[this.currentTurn].pieces[2]--;

        // Tells all users about the city position
        this.broadcastGameInfo({
            "game" : "upgrade",
            "user" : this.currentTurn,
            "position" : position
        });

        // Checks for a winner
        this.checkForWinner();

        return true;
    }

    // Method for adding a road into the game, taking in a user, the 2 node positions, and errorCallback
    // Returns if the road can be added
    addRoad(user : Client, position : Array<Array<number>>, errorCallback : (ws : any, message : string) => any) : boolean{
        // If it's not the right turn type or if the user hasn't rolled, tells user it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        // Checks if it's the user's turn type, if not, tells the user it's not the right turn type
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }

        // Checks if the user has enough road pieces, if not, tells the user they do not have enough pieces
        if(this.users[this.currentTurn].pieces[0] == 0){
            errorCallback(user.connnection, "Not enough pieces");
            return false;
        }

        // Checks if the user has enough resources to build, if not, tells the user they do not have enough resources
        let resources = this.users[this.currentTurn].resources;
        if(resources[1] == 0 || resources[4] == 0){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }

        // Checks if the position for the road is in a valid position, if not, tells the user the position is invalid
        if(!this.board.validRoad(this.users[this.currentTurn].nodes, position)){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }

        // Removes the resources from the player
        resources[1]--, resources[4]--;
        this.numOfResources[this.currentTurn] -= 2;

        // Gets the nodes and add the nodes to nodes the user is connected to
        let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
        this.users[this.currentTurn].nodes.add(node[0]);
        this.users[this.currentTurn].nodes.add(node[1]);

        // Remove a road piece from the user
        this.users[this.currentTurn].pieces[0]--;

        // Adds the road onto the board
        this.board.addRoad(position, this.currentTurn);

        // Finds the longest path for the user
        this.findLongestPathUser(this.currentTurn);

        // Checks for a winner
        this.checkForWinner();

        // Tells the user about the road
        this.broadcastGameInfo({
            "game" : "road",
            "user" : this.currentTurn,
            "position" : position
        });
        return true;
    }

    // Method for starting placement of road and settlement for the start of the game, takes in the user, the position of the settlement, the end position of the road from the settlement, and errorCallback
    // returns whether or not the placements can be added
    startingPlacement(user : Client, settlement : Array<number>, road : Array<number> ,errorCallback : (ws : any, message : string) => any) : boolean{
        // Checks if it's the users turn, if not, tells user it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }
        
        // Checks if the roundtype isn't the actual game, and is the early game, if it isn't the early, tells ther user it isn't the early game
        if(this.roundType == 2){
            errorCallback(user.connnection, "Not early game");
            return false;
        }
        // Checks if the settlement is valid, and the road is won't collide, if not, tells user the position is invalid
        if(!this.board.validSettlement(settlement) || this.board.collisionRoad([settlement, road])){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }

        // Adds the settlement at that position and adds the road at that position
        this.board.addSettlement(settlement, this.currentTurn);
        this.board.addRoad([settlement, road], this.currentTurn);

        // Adds the nodes of road and the settlement to the nodes that player is connected to
        this.users[this.currentTurn].nodes.add(this.board.getHexagon(settlement[0], settlement[1]).getNode(settlement[2]));
        this.users[this.currentTurn].nodes.add(this.board.getHexagon(road[0], road[1]).getNode(road[2]));
        
        // If it's the second round of early game
        if(this.roundType == 1){
            // Loops through all adjacent hexagons to the settlement, and gets the resources (unless it's 0) and adds the resource to the player
            this.board.getHexagon(settlement[0], settlement[1]).getNode(settlement[2]).getAdjacentHexagons().forEach(hexagon => {
                if(hexagon.getResource() == 0) return;
                this.users[this.currentTurn].resources[hexagon.getResource() - 1]++;
                this.numOfResources[this.currentTurn]++;
            });
        }

        // Removes a road and settlement piece from the user
        this.users[this.currentTurn].pieces[0]--;
        this.users[this.currentTurn].pieces[1]--;

        // Finds the longest path for the user
        this.findLongestPathUser(this.currentTurn);

        // Broadcast the settlement placement, and the road placement
        this.broadcastGameInfo({
            "game" : "early game placement",
            "user" : this.currentTurn,
            "settlement" : settlement,
            "road" : road
        });
        return true;
    }

    // Method for getting a widlcard, taking in user, and errorCallback
    getCard(user : Client, errorCallback : (ws : any, message : string) => any) : boolean{
        // checks if it's the right turn type (2), and the user rolled the dice, if not, tells the user it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        // Checks if it's the user's turn, if not, tells the user it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }

        // Checks if the user has enough resources to get a card, if not, tells the user they do not have enough resources
        if(this.users[this.currentTurn].resources[0] == 0 || this.users[this.currentTurn].resources[2] == 0 || this.users[this.currentTurn].resources[3] == 0){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }

        // Adds up all the remaining cards in the game, and checks if there is a card available, if not, tells the user there are no cards available
        if(this.numOfRemainingCards.reduce((a, b) => a + b) == 0){
            errorCallback(user.connnection, "No cards available");
            return false;
        }

        // Removes resources from user for card
        this.users[this.currentTurn].resources[0]--;
        this.users[this.currentTurn].resources[2]--;
        this.users[this.currentTurn].resources[3]--;
        this.numOfResources[this.currentTurn] -= 3;

        // Randomly generates a card that is still available in the game
        let randomCard = Math.floor(Math.random() * 5);
        while(this.numOfRemainingCards[randomCard] == 0){
            randomCard = Math.floor(Math.random() * 5);
        }

        // If the user doesn't have that type of card, sets that type of card to unplayable, as you cannot play a card that you just received
        if(this.users[this.currentTurn].cards[randomCard] == 0){
            if(this.cantPlayCard == undefined) this.cantPlayCard = new Array(5).fill(false);
            this.cantPlayCard[randomCard] = true;
        }

        // Increments the number of card the user has, and decrements the number of the remaining cards there are
        this.users[this.currentTurn].cards[randomCard]++;
        this.numOfCardsUsers[this.currentTurn]++;
        this.numOfRemainingCards[randomCard]--;
        
        // If the card is a victory point, increments the number of victory points for the user (not publically), and checks for a winner
        if(randomCard == 1){
            this.users[this.currentTurn].victoryPoints++;
            this.checkForWinner();
        }

        // Tells all players that a card has been picked up
        this.broadcastGameInfo({
            "game" : "pickedUpCard"
        });
        return true;
    }

    // Method that plays the card from the user, taking in the user, errorCallback, the card type, and any additional information for the card
    playCard(user : Client, errorCallback : (ws : any, message : string) => any, cardNumber : number, additionalInformation?: { robberPosition? : Array<number>, monopoly? : number, resources? : Array<number>, road? : Array<Array<Array<number>>>}) : void{
        // Checks if it's the right turn type to play the card (the actual game), if not, tells the user that it's not the right turn type
        if(this.roundType != 2){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        // Checks if it's not the user's turn, and tells the user it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        // Checks if the user already played a card this turn, and tells the user they're already played a card
        if(this.cardPlayed){
            errorCallback(user.connnection, "Already played a card");
            return;
        }
        // Checks if the user at least has a card, if not, tells the user they do not have the card
        if(this.users[this.currentTurn].cards[cardNumber] == 0){
            errorCallback(user.connnection, "Not enough cards");
            return;
        }
        // Checks if they can play that card type, if not, tells the user they can't play that card type
        if(this.cantPlayCard != undefined && this.cantPlayCard[cardNumber]){
            errorCallback(user.connnection, "Cant play this card");
            return;
        }

        switch(cardNumber){
            // If the card number is 0 (knight)
            case 0:{
                // Checks if the user specified a robberPosition, if not, tells them data is invalid
                if(!isTypeArray(additionalInformation.robberPosition, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Checks if the robber position is valid, if not, tells the user the position is invalid
                if(!this.robberMove(user, additionalInformation.robberPosition, errorCallback)){
                    errorCallback(user.connnection, "Position is invalid");
                    return;
                }
                // Increments the number of knights the user has played throughout the game
                this.knights[this.currentTurn]++;
                // Checks if the number of knights the player has played is >= 3
                if(this.knights[this.currentTurn] >= 3){
                    // Checks if there hasn't been a player with the largest army, or if the current user has a larger army
                    if(this.currentLargestArmy == -1 || this.knights[this.currentLargestArmy] < this.knights[this.currentTurn]) {
                        // if there was a user with the former largest army, remove their victory points for largest army
                        if(this.currentLargestArmy != -1){
                            this.publicVictoryPoints[this.currentLargestArmy] -= 2;
                            this.users[this.currentLargestArmy].victoryPoints -= 2;
                        }
                        // Adds the victory points to the user, and sets the largest army to the user
                        this.publicVictoryPoints[this.currentTurn] += 2;
                        this.users[this.currentTurn].victoryPoints += 2;
                        this.currentLargestArmy = this.currentTurn;
                    }
                }
                break;
            }
            // Check if the user played a monopoly card
            case 2:{
                // Checks if the user specified a monopoly with type number, if not, tells user the data is invalid
                if(typeof additionalInformation.monopoly != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Variable that stores the number of that type of resource
                let totResources = 0;
                // Loops through all the users
                for(let i = 0; i < this.users.length; i++){
                    // Skips the user
                    if(i == this.currentTurn) continue;
                    // Increments the number of resources there are, and removes those resources from the user
                    totResources += this.users[i].resources[additionalInformation.monopoly];
                    this.numOfResources[i] -= this.users[i].resources[additionalInformation.monopoly];
                    this.users[i].resources[additionalInformation.monopoly] = 0;
                }
                // Add the resource to the users
                this.users[this.currentTurn].resources[additionalInformation.monopoly] += totResources;
                this.numOfResources[this.currentTurn] += totResources;
                break;
            }
            // Check if the user played a year of plenty card
            case 3:{
                // Checks if the user specified an array of numbers for resources, if not, tells the user is invalid
                if(!isTypeArray(additionalInformation.resources, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Adds the 2 resources to the user
                this.numOfResources[this.currentTurn] += 2;
                this.users[this.currentTurn].resources[additionalInformation.resources[0]]++;
                this.users[this.currentTurn].resources[additionalInformation.resources[1]]++;
                break;
            }
            // Checks if the user played a road building card
            case 4:{
                // Checks if the user did not specify a road, and tells the user the road is invalid
                if(additionalInformation.road == undefined){
                    errorCallback(user.connnection, "Invalid data");
                    return;
                }

                // Checks if the user has enough pieces to build a road
                if(this.users[this.currentTurn].pieces[0] == 0){
                    errorCallback(user.connnection, "Not enough pieces");
                    return;
                }

                // Checks if the user only has enough to build 1 road
                if(this.users[this.currentTurn].pieces[0] == 1){
                    // Gets the first road specified
                    let position = additionalInformation.road[0];
                    // Checks if the road is valid, if not, tells the user the road is invalid
                    if(!this.board.validRoad(this.users[this.currentTurn].nodes, position)){
                        errorCallback(user.connnection, "Position is invalid");
                        return;
                    }

                    // Gets the 2 nodes of the road, and adds them to the network of roads the user has stored
                    let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
                    let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
                    this.users[this.currentTurn].nodes.add(node[0]);
                    this.users[this.currentTurn].nodes.add(node[1]);
                    // Removes the road pieces from the user
                    this.users[this.currentTurn].pieces[0]--;

                    // Adds the road of the user to the board
                    this.board.addRoad(position, this.currentTurn);

                    // Finds the longest path of the user
                    this.findLongestPathUser(this.currentTurn);

                    // Tells all the users about the new road
                    this.broadcastGameInfo({
                        "game" : "road",
                        "user" : this.currentTurn,
                        "position" : position
                    });
                }
                // Else if you can add 2 roads
                else{
                    // Gets the positions of the both the roads
                    let positions = additionalInformation.road;
                    // Checks if both roads branch off from the main network of roads and are valid
                    if(this.board.validRoad(this.users[this.currentTurn].nodes, positions[0]) && this.board.validRoad(this.users[this.currentTurn].nodes, positions[1])){
                        // Loops through both positions of the road
                        positions.forEach(position => {
                            // Gets both nodes of the road and adds the nodes to the stored network of nodes of the user
                            let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
                            let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
                            this.users[this.currentTurn].nodes.add(node[0]);
                            this.users[this.currentTurn].nodes.add(node[1]);
                            // Removes the road piece from the user
                            this.users[this.currentTurn].pieces[0]--;

                            // Adds the road to the board
                            this.board.addRoad(position, this.currentTurn);

                            // Broadcasts the new road to the user
                            this.broadcastGameInfo({
                                "game" : "road",
                                "user" : this.currentTurn,
                                "position" : position
                            });
                        });
                        // Finds the longest path of the user
                        this.findLongestPathUser(this.currentTurn);
                    }
                    // Else if both roads are not part of the main network
                    else {
                        // Checks if both roads will not collide, if they collide, tells the user that the position is invalid
                        if(this.board.collisionRoad(positions[0]) || this.board.collisionRoad(positions[1])){
                            errorCallback(user.connnection, "Position is invalid");
                            return;
                        }
                        // Checks if at least one of the roads is valid
                        if(this.board.validRoad(this.users[this.currentTurn].nodes, positions[0]) || this.board.validRoad(this.users[this.currentTurn].nodes, positions[1])){
                            // Variable that stores if the road at least shares a common node
                            let sharesCommon = false;
                            // Loops through both nodes of both roads and checks if they share a common node
                            for(let i = 0; i < 2; i++){
                                for(let j = 0; j < 2; j++){
                                    if(this.board.getHexagon(positions[0][i][0], positions[0][i][1]).getNode(positions[0][i][2]) == this.board.getHexagon(positions[0][j][0], positions[0][j][1]).getNode(positions[0][j][2])){
                                        sharesCommon = true;
                                        break;
                                    }
                                }
                                if(sharesCommon) break;
                            }
                            // Checks if they don't share a common node and tells the user that the position is invalid
                            if(!sharesCommon){
                                errorCallback(user.connnection, "Position is invalid");
                                return;
                            }
                            // Loops through both roads
                            positions.forEach(position => {
                                // Gets the 2 nodes of the road and adds the roads to the network of nodes the user stores
                                let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
                                let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
                                this.users[this.currentTurn].nodes.add(node[0]);
                                this.users[this.currentTurn].nodes.add(node[1]);
                                // Removing the road piece from the user
                                this.users[this.currentTurn].pieces[0]--;
    
                                // Adds the road to the board
                                this.board.addRoad(position, this.currentTurn);
    
                                // Tells all the users about the new road
                                this.broadcastGameInfo({
                                    "game" : "road",
                                    "user" : this.currentTurn,
                                    "position" : position
                                });
                            });
                            // Finds the longest road for this user
                            this.findLongestPathUser(this.currentTurn);
                        }
                        else{
                            // Else if none of the roads are valid, tells the user that the positions are invalid
                            errorCallback(user.connnection, "Position is invalid");
                            return;
                        }
                    }
                }
                break;
            }
            // Invalid card number, tells the user about the invalid card number
            default : {
                errorCallback(user.connnection, "Invalid card number");
                return;
            }
        }

        // Resets cantPlayCard to undefined, but sets cardPlayed to true
        this.cantPlayCard = undefined;
        this.cardPlayed = true;

        // Removes the card from the user
        this.users[this.currentTurn].cards[cardNumber]--;
        this.numOfCardsUsers[this.currentTurn]--;

        // Checks for a winner
        this.checkForWinner();

        // Broadcast the user playing the card
        this.broadcastGameInfo({
            "game" : "card played",
            "card" : cardNumber
        });
    }

    // Method for making a trade with the marketplace, taking in the user, resources (which has an array for resources being given, and array for resources being taken), and errorCallback
    marketTrade(user : Client, resources : Array<Array<number>>, errorCallback : (ws : any, message : string) => any) : void{
        // Checks if it's the right round type, and the dice has been rolled, if not, tells the user that it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        // Checks if it's the user's turn, if not, tells the user that it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        // Default trading value, if the user is connected a generic harbour, they can trade 3 resources by default, if not, 4 resources by default
        let defaultTrade = (this.users[this.currentTurn].harbour[0]) ? 3 : 4;
        // Gets sum of resources that the user wants
        let numResourcesTrading = resources[1].reduce((a, b) => a+b);
        // Variable that stores the number of resources the user is expected to receive with the amount being sent for trading
        let tradingAmount = 0;
        // Loops through all the resources
        for(let i = 0; i < 5; i++){
            // If the user does not have the resources being sent, tells the user they do not have enough resources
            if(this.users[this.currentTurn].resources[i] < resources[0][i]){
                errorCallback(user.connnection, "Not enough resources");
                return;
            }
            // Checks if the user sent the right amount of resources (is a multiple of defautlTrade, or 2 if the user has a harbour for that resource), if not, tells the user that they have an invalid amount
            if(resources[0][i] % ((this.users[this.currentTurn].harbour[i + 1]) ? 2 : defaultTrade) != 0){
                errorCallback(user.connnection, "Invalid number of resources");
                return;
            }
            // Gets trading amount by dividing the amount of resources being sent by the ratio of trading
            tradingAmount += resources[0][i] / ((this.users[this.currentTurn].harbour[i + 1]) ? 2 : defaultTrade);
        }

        // Checks if the amount expected to receive doesn't equal the amount requested and tells the user it's an invalid amount
        if(tradingAmount != numResourcesTrading){
            errorCallback(user.connnection, "Invalid number of resources");
            return;
        }

        // Removes the number of resources sent, and adds the number of resources request
        for(let i = 0; i < 5; i++){
            this.users[this.currentTurn].resources[i] -= resources[0][i];
            this.numOfResources[this.currentTurn] -= resources[0][i];
            this.users[this.currentTurn].resources[i] += resources[1][i];
            this.numOfResources[this.currentTurn] += resources[1][i];
        }

        // Tells all users about a market trade
        this.broadcastGameInfo({
            "game" : "market trade"
        });
    }

    // Method for trading with other users, taking in user, resources array (2d with array for sending, and array for receiving), and errorCallback
    userTrade(user : Client, resources : Array<Array<number>>, errorCallback : (ws : any, message : string) => any) : void {
        // Checks if it's the right round type, and the dice has been rolled, if not, tells the user that it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        // Checks if it's the user's turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        // Loops through all the resources and checks if the user has enough resources to send, if not, tells the user it's an invalid amount
        for(let i = 0; i < 5; i++){
            if(this.users[this.currentTurn].resources[i] < resources[0][i]){
                errorCallback(user.connnection, "Not enough resources");
                return;
            }
        }
        // Makes a copy of the requested trade and stores it
        this.currentTrade = [[...resources[0]], [...resources[1]]];
        // Creates an array storing each user's response
        this.tradeUser = new Array(this.users.length).fill(0);
        // Sets the current user's trade to -1
        this.tradeUser[this.currentTurn] = -1;
        // Broadcasts trade request
        this.broadcastGameInfo({
            "game" : "trade request",
            "trade" : resources
        });
    }

    // Method for accepting or denying other user's trade request
    otherUserTrade(user : Client, accept : boolean, errorCallback : (ws : any, message : string) => any) : void{
        // Checks if it's the right round type, and the dice has been rolled, if not, tells the user that it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        // Check if it is the user's turn, and if it is, can't respond to own trade request
        if(this.isUserTurn(user)){
            errorCallback(user.connnection, "Cant respond to own trade request");
            return;
        }
        // Checks if there isn't a trade going on, and tells the user that there's no trade going on
        if(this.currentTrade == undefined){
            errorCallback(user.connnection, "No trades going on");
            return;
        }

        // Finds user's index in the user array
        let userNum = -1;
        for(let i = 0; i < this.users.length; i++){
            if(this.users[i].client == user) userNum = i;
        }

        // Checks if the user already confirmed or denied the trade, and tells the user if so
        if(this.tradeUser[userNum] != 0){
            errorCallback(user.connnection, "Already confirmed trade");
            return;
        }

        // If the user does not want to accept the trade, updates their status
        if(!accept){
            this.tradeUser[userNum] = 2;
        }
        // Else not
        else{
            // Loops through and checks if the user has enough resources, if not, tells the user
            for(let i = 0; i < 5; i++){
                if(this.users[userNum].resources[i] < this.currentTrade[1][i]){
                    errorCallback(user.connnection, "Not enough resources");
                    return;
                }
            }
            // Sets their trade status to 1
            this.tradeUser[userNum] = 1;
        }
        // Broadcast the current trade status
        this.broadcastGameInfo({
            "game" : "trade status",
            "users" : this.tradeUser,
            "responded" : this.tradeUser.every(a => a != 0),
            "failed" : this.tradeUser.every(a => a != 0 && a != 1)
        });

        // Checks if every one has responded and no accepted, and resets the trade
        if(this.tradeUser.every(a => a != 0 && a!= 1)){
            this.tradeUser = undefined;
            this.currentTrade = undefined;
        }
    }

    // Method for the main user to accept the trade from another user
    acceptTrade(user : Client, otherUser : number, errorCallback : (ws : any, message : string) => any) : void{
        // Checks if it's the right round type, and the dice has been rolled, if not, tell the user that it's not the right turn type
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }

        // Checks if it's the users turn, if not, tells the user that it's not their turn
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        // Checks if there's a trade going on, if not, tells the user there's no trade going on
        if(this.currentTrade == undefined || this.tradeUser == undefined){
            errorCallback(user.connnection, "No trades available");
            return;
        }
        // Checks if no one wanted to accepted the trade, and tells the user there's no trade going on
        if(!this.tradeUser.some(a => a == 1)){
            errorCallback(user.connnection, "No trades available");
            return;
        }
        // Checks if the user wished to accept the trade, if not, tells the user the player is invalid
        if(this.tradeUser[otherUser] != 1){
            errorCallback(user.connnection, "Invalid user selected");
            return;
        }
        // Loops through the resrouces
        for(let i = 0; i < 5; i++){
            // Removes the resources the currentplayer is trying to send, and adds the resources they're receiving
            this.users[this.currentTurn].resources[i] -= this.currentTrade[0][i];
            this.users[this.currentTurn].resources[i] += this.currentTrade[1][i];
            this.numOfResources[this.currentTurn] -= this.currentTrade[0][i] - this.currentTrade[1][i];

            // Removes the resources the otherplayer is sendng, and adds the resources they're receiving
            this.users[otherUser].resources[i] -= this.currentTrade[1][i];
            this.users[otherUser].resources[i] += this.currentTrade[0][i];
            this.numOfResources[otherUser] -= this.currentTrade[1][i] - this.currentTrade[0][i];
        }
        // Sets the trades as finished and no trade going on
        this.currentTrade = undefined;
        this.tradeUser = undefined;
        // Broadcasts that the trade is complete
        this.broadcastGameInfo({
            "game" : "trade completed"
        });
    }
}

// Main class for mapping the Games to their gamekey
export default class Games{
    // Map which stores the games
    private games : Map<string, Game>;
    constructor(){
        // Creates new map
        this.games = new Map();
    }
    // Method if the user wishes to create a game
    createGame(user : Client, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        // if the user is already in a game, tells the user they can't create a game
        if(user.joinedGame != undefined){
            errorCallback(user.connnection, "User already in a game");
            return;
        }
        // Generates a random gamekey using uuid that doesn't already exist in the map
        let gameKey = uuidv4().slice(-5);
        while(this.games.has(gameKey)) gameKey = uuidv4().slice(-5);

        // Creates new game with that uuid
        let game = new Game(user.guid, gameKey);
        // Makes user join the game
        game.joinGame(user);
        // Sets the gamekey to the game and tells the user that the game has been successfully created with gamekey
        this.games.set(gameKey, game);
        successCallback(user.connnection, {
            "gamekey" : gameKey
        })
    }
    // Method for joining a game
    joinGame(gameKey : string, user : Client, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        // Checks if the user has already joined a game, and tells them they're already in a game
        if(user.joinedGame != undefined){
            errorCallback(user.connnection, "User already in a game");
            return;
        }
        // If the game key is in the map, if not, tells the user the gamekey is invalid
        if(!this.games.has(gameKey)){
            errorCallback(user.connnection, "Invalid game key");
            return;
        }
        // Gets the game using the gamekey
        let game = this.games.get(gameKey);
        // Checks if the game has already started, if it is, tells the user they can't join
        if(game.isGameStarted()){
            errorCallback(user.connnection, "Game has already started");
            return;
        }
        // Attempts to join the game
        if(game.joinGame(user)){
            // Gets list the names of the joined players and tells the user the list of joined members
            let namesOfJoinedUsers = [];
            game.getUsers().forEach(element => {
                if(user.guid != element.client.guid)
                    namesOfJoinedUsers.push(element.client.name);
            });
            successCallback(user.connnection, {"joinedUsers" : namesOfJoinedUsers});
        }
        // Else if can't join the game, tells the user that the game is full
        else{
            errorCallback(user.connnection, "Game is full");
        }
    }
    // Method for getting the current joined game of a user
    getJoinedGame(user : Client, errorCallback : (ws : any, message : string) => any) : Game {
        // If the user doesn't have a joined game, tells the user that they do not have a joined game
        if(user.joinedGame == undefined){
            errorCallback(user.connnection, "No game joined");
            return undefined;
        }
        // Gets the game from their gamekey of their client
        return this.games.get(user.joinedGame);
    }
    // Method for starting the current game of the user
    startCurrentGame(user : Client, errorCallback : (ws : any, message : string) => any) : void {
        // Gets the of the user
        let game = this.getJoinedGame(user, errorCallback);
        // Checks if the game is valid
        if(game != undefined){
            // Checks if the user is the game onwer
            if(game.isGameOwner(user.guid)){
                // Tries to start the game, if it fails, tells the user there's not enough players
                if(!game.startGame()){
                    errorCallback(user.connnection, "Not enough users");
                } 
            }
            else{
                // Else if not the game owner, tells the user they're not hte game owner
                errorCallback(user.connnection, "Not game owner");
            }
        }
    }
    // Method for updating the game with data specified
    updateGame(user : Client, json : any, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        // Gets the current game the user has joined
        let game = this.getJoinedGame(user, errorCallback);
        // If no game, returns
        if(game == undefined) return;
        // Checks if the game has started, if not, tells user
        if(!game.isGameStarted()){
            errorCallback(user.connnection, "Game not started");
            return;
        }
        // Checks if the user sent data for action for the game, if not, tells the user it's invalid
        if(json.game == undefined || (typeof json.game) != "string") {
            errorCallback(user.connnection, "Data invalid");
            return;
        }
        switch (json.game){
            // If the user asked to startSettlement, checks if the user contained settlement and road data, if so, attempts to call game method with data and end turn, if not, errors out
            case "startSettlement" : {
                if(!isTypeArray(json.settlement, "number") || !isTypeArray(json.road, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                if(game.startingPlacement(user, json.settlement, json.road, errorCallback))
                    game.endTurn(user, errorCallback);
                break;
            }
            // Rolling the dice
            case "dice" : {
                game.rollDice(user, errorCallback);
                break;
            }
            // If the user asked to end their current turn
            case "end" : {
                game.endTurn(user, errorCallback);
                break;
            }
            // If user wishes to place a new settlement
            case "settlement" : {
                // Checks if the settlement is the right value, if not, sends error
                if(!isTypeArray(json.settlement, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Attempts to add a settlement with the data
                game.addSettlement(user, json.settlement, errorCallback);
                break;
            }
            // If user wishes to upgrade settlement
            case "city" : {
                // Checks if the settlement is the right value, if not, sends error
                if(!isTypeArray(json.settlement, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Attempts to upgade a settlement with the data
                game.upgradeSettlement(user, json.settlement, errorCallback);
                break;
            }
            // If user wishes to create a road
            case "road" : {
                // Checks if the road is the right value, if not, sends error
                if(!(json.road instanceof Array) || !isTypeArray(json.road[0], "number") || !isTypeArray(json.road[1], "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Attempts to place a road with data
                game.addRoad(user, json.road, errorCallback);
                break;
            }
            // If user is forfeiting resources
            case "forfeit" : {
                // Checks if the resources is the right value, if not, sends error
                if(!isTypeArray(json.resources, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Attempts to forfeit resources with data
                game.forfeit(user, json.resources, errorCallback);
                break;
            }
            // If users is moving robber
            case "robber" : {
                // Checks if the position is the right value, if not, sends error
                if(!isTypeArray(json.position, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Attempts to move robber with data
                game.robberMove(user, json.position, errorCallback);
                break;
            }
            // Attempts to rob user, checks if data is valid, if not errors out
            case "rob" : {
                if(typeof json.player != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.rob(user, json.player, errorCallback);
                break;
            }
            // Attempts to get card
            case "getCard" : {
                game.getCard(user, errorCallback);
                break;
            }
            // If user is wishing to play card
            case "playCard" : {
                if((typeof json.card) != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Calls play card method with data
                game.playCard(user, errorCallback, json.card, json.additionalInformation);
                break;
            }
            // If user wishes to make a market trade
            case "marketTrade" : {
                // If not resource is a 2d array with numbers
                if(!(json.resources instanceof Array) || !isTypeArray(json.resources[0], "number") || !isTypeArray(json.resources[1], "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // Calls marketTrade method
                game.marketTrade(user, json.resources, errorCallback);
                break;
            }
            // if user wishes to make a trade with another user
            case "userTrade" : {
                // If not resource is a 2d array with numbers
                if(!(json.resources instanceof Array) || !isTypeArray(json.resources[0], "number") || !isTypeArray(json.resources[1], "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // calls usertrade method
                game.userTrade(user, json.resources, errorCallback);
                break;
            }
            // if other user wishes to accept trade
            case "otherUserTrade" : {
                if(typeof json.accept != "boolean"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // calls otherUserTrade method
                game.otherUserTrade(user, json.accept, errorCallback);
                break;
            }
            // if user wishes to accept trade
            case "acceptTrade" : {
                if(typeof json.otherUser != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                // calls acceptTrade method
                game.acceptTrade(user, json.otherUser, errorCallback);
                break;
            }
            // If action is not in list of commands, errors out
            default : {
                errorCallback(user.connnection, "Command invalid");
                break;
            }
        }
    }
    // Method for removing player from game
    removeUser(user : Client){
        // Checks if the user is not already in joined game
        if(user.joinedGame == undefined) return;
        // Gets the game joined by user
        let game = this.games.get(user.joinedGame);
        // Removes the user from the game
        game.removeUser(user);
        // If the user is a game owner, closes the game, and deletes the game from map
        if(game.isGameOwner(user.guid)){
            game.gameClosed();
            this.games.delete(user.joinedGame);
        }
        // Else if the game has already started
        else if(game.isGameStarted()){
            // Ends game prematurely
            game.endPreamturely();
        }
    }
}