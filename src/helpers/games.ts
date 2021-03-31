import { Board, Node } from './board';
import { Client } from './clients';
import { v4 as uuidv4 } from 'uuid';

enum GameConst{
    MAX_PLAYERS = 4,
    MIN_PLAYERS = 3
}

interface gamePlayer {
    client : Client,
    resources : Array<number>,
    victoryPoints : number,
    nodes : Set<Node>,
    harbour : Array<boolean>,
    cards : Array<number>,
    pieces : Array<number>
}

function shuffle(array : Array<any>){
    var currentIndex = array.length, temp : number, random : number;
    while(0 != currentIndex){
        random = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temp = array[currentIndex];
        array[currentIndex] = array[random];
        array[random] = temp;
    }
    return array;
}

function isTypeArray(input : any, type : String) : boolean{
    if(!(input instanceof Array)) return false;
    for(let i of input){
        if(typeof i != type) return false;
    }
    return true;
}

class Game{
    private users : Array<gamePlayer>;
    private board : Board;

    private gameStarted : boolean;
    private gameKey : string;
    private gameOwner : string;
    
    private currentTurn : number;
    private roundType : number;
    private justRolled : boolean;

    private numOfRemainingCards : Array<number>;
    private numOfCardsUsers : Array<number>;
    private numOfResources : Array<number>;
    private numForfeit : Array<number>;

    private longestRoads : Array<number>;
    private knights : Array<number>;
    
    private publicVictoryPoints : Array<number>;
    
    private moveRobber : boolean;
    private validRobberies : Set<number>;
    
    private currentTrade : Array<Array<number>>;
    private tradeUser : Array<number>;

    private cardPlayed : boolean;
    private cantPlayCard : Array<boolean>;

    private currentLongestRoad : number;
    private currentLargestArmy : number;

    constructor(gameOwner : string, gameKey : string){
        this.users = new Array();
        this.gameKey = gameKey;
        this.gameOwner = gameOwner;
        this.init();
    }

    init() : void{
        this.board = new Board();

        this.gameStarted = false;
        this.currentTurn = 0;
        this.roundType = 0;
        
        this.justRolled = false;

        this.moveRobber = false;
        
        this.cardPlayed = false;
        this.numOfRemainingCards = [14, 5, 2, 2, 2];
        this.numOfCardsUsers = [0, 0, 0, 0];
        this.cantPlayCard = undefined;

        this.publicVictoryPoints = [0, 0, 0, 0];
        this.knights = [0, 0, 0, 0];
        this.longestRoads = [0, 0, 0, 0];
        this.numOfResources = [0, 0, 0, 0];
        
        this.currentTrade = undefined;
        this.tradeUser = undefined;
        
        this.currentLargestArmy = -1;
        this.currentLongestRoad = -1;

        this.validRobberies = new Set();
        this.numForfeit = [0, 0, 0, 0];
    }

    getKey() : string{
        return this.gameKey;
    }
    getUsers() : Array<gamePlayer> {
        return this.users;
    }
    winner(user : number) : boolean{
        if(this.users[user].victoryPoints >= 10){
            this.broadcastToUsers({
                "game" : "end",
                "winner" : user
            });
            this.init();
            return true;
        }
        return false;
    }
    checkForWinner() : void {
        for(let i = 0; i < this.users.length; i++){
            if(this.winner(i)) return;
        }
    }
    isGameOwner(userId : string) : boolean {
        return userId === this.gameOwner;
    }
    isGameStarted() : boolean {
        return this.gameStarted;
    }
    isUserTurn(user : Client) : boolean {
        return this.users[this.currentTurn].client == user;
    }
    broadcastToUsers(json : any){
        this.users.forEach(user => {
            user.client.connnection.send(JSON.stringify(json));
        });
    }
    broadcastGameInfo(json = {}){
        this.users.forEach(user => {
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
    startGame() : boolean{
        if(this.users.length < GameConst.MIN_PLAYERS) return false;
        shuffle(this.users);
        for(let i = 0; i < this.users.length; i++){
            this.users[i].client.connnection.send(JSON.stringify({
                "game" : "started",
                "hexagons" : this.board.getAllHexagons(),
                "harbours" : this.board.getAllHarbours(),
                "turn" : i,
                "numOfUsers" : this.users.length 
            }));
        }
        return this.gameStarted = true;
    }

    joinGame(user : Client) : boolean {
        if(this.users.length >= GameConst.MAX_PLAYERS) return false;
        this.broadcastToUsers({
            "message" : `${user.name} has joined the game`
        });
        this.users.push({
            client : user,
            resources : [0, 0, 0, 0, 0],
            victoryPoints : 0,
            nodes : new Set(),
            harbour : [false, false, false, false, false, false],
            cards : [0, 0, 0, 0, 0],
            pieces : [15, 5, 4]
        });
        user.joinedGame = this.gameKey;
        return true;
    }
    
    endTurn(user : Client, errorCallback : (ws : any, message : string) => any) : void {
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        if(this.roundType == 0){
            if(this.currentTurn == this.users.length - 1) this.roundType++;
            else this.currentTurn++;
        }
        else if(this.roundType == 1){
            if(this.currentTurn == 0) this.roundType++;
            else this.currentTurn--;
        }
        else{
            this.currentTurn = (this.currentTurn + 1) % this.users.length;
        }
        
        this.cantPlayCard = undefined;
        this.cardPlayed = false;

        this.justRolled = false;

        this.currentTrade = undefined;
        this.tradeUser = undefined;

        this.broadcastGameInfo({
            "game" : "turn end",
            "turn" : this.currentTurn,
            "round" : this.roundType
        });
    }

    rob(user : Client, robbedPlayer : number, errorCallback : (ws : any, message : string) => any) : void{
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        if(this.validRobberies.size == 0){
            errorCallback(user.connnection, "Not valid move");
            return;
        }
        if(!this.validRobberies.has(robbedPlayer)){
            errorCallback(user.connnection, "Not a valid player");
            return;
        }
        let resource = Math.floor(Math.random() * 5);
        while(this.users[robbedPlayer].resources[resource] == 0){
            resource = Math.floor(Math.random() * 5);
        }
        this.users[robbedPlayer].resources[resource]--;
        this.numOfResources[robbedPlayer]--;
        this.users[this.currentTurn].resources[resource]++;
        this.numOfResources[this.currentTurn]++;
        this.broadcastGameInfo({"game" : "robbery"});
        this.validRobberies = new Set();
    }

    robberMove(user : Client, position : Array<number>, errorCallback : (ws : any, message : string) => any, cardPlayed : boolean = false) : boolean{
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }
        if(this.moveRobber == false && !cardPlayed){
            errorCallback(user.connnection, "Not valid move");
            return false;
        }
        
        if(this.board.moveRobber(position)){
            this.validRobberies = new Set();

            this.board.getHexagon(position[0], position[1]).getAllNodes().forEach(node => {
                console.log(node.getUser());
                console.log(this.numOfResources[node.getUser()]);
                if(node.getUser() != -1 && node.getUser() != this.currentTurn && this.numOfResources[node.getUser()] > 0) this.validRobberies.add(node.getUser());
            });
            
            this.moveRobber = false;
            
            // Debug response
            console.log(this.validRobberies);

            if(this.validRobberies.size == 0) {
                this.broadcastGameInfo({"game" : "robbery", "robber" : position});
                return;
            }
            else if(this.validRobberies.size == 1){
                let resource = Math.floor(Math.random() * 5);
                let val = this.validRobberies.values().next().value;
                while(this.users[val].resources[resource] == 0){
                    resource = Math.floor(Math.random() * 5);
                }
                this.users[val].resources[resource]--;
                this.numOfResources[val]--;
                this.users[this.currentTurn].resources[resource]++;
                this.numOfResources[this.currentTurn]++;
                this.broadcastGameInfo({"game" : "robbery", "robber" : position});
                this.validRobberies = new Set();
            }
            else{
                user.connnection.send(JSON.stringify({
                    "game" : "rob",
                    "users" : Array.from(this.validRobberies)
                }));
            }
            return true;
        }
        else{
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }
    }

    robberForfeit() : void{
        for(let i = 0; i < this.users.length; i++){
            if(this.numOfResources[i] >= 8){
                this.numForfeit[i] = this.numOfResources[i] / 2;
                this.users[i].client.connnection.send(JSON.stringify({
                    "game" : "forfeit",
                    "numberForfeit" : this.numForfeit[i]
                }));
            }
            else{
                this.numForfeit[i] = 0;
            }
        }
        if(this.numForfeit.every(num => num == 0)){
            this.moveRobber = true;
            this.users[this.currentTurn].client.connnection.send(JSON.stringify({
                "game" : "move robber"
            }));
        }
    }

    forfeit(user : Client, resources : Array<number>, errorCallback : (ws : any, message : string) => any) : void {
        for(let i = 0; i < this.users.length; i++){
            if(this.users[i].client == user){
                if(resources.reduce((a, b) => a + b) != this.numForfeit[i]){
                    errorCallback(user.connnection, "Invalid amount of resources");
                }
                for(let j = 0; j < 5; j++){
                    if(resources[j] > this.users[i].resources[j]){
                        errorCallback(user.connnection, "Invalid amount of resources");
                        return;
                    }
                }
                for(let j = 0; j < 5; j++) this.users[i].resources[j] -= resources[j];
                this.numOfResources[this.currentTurn] -= this.numForfeit[i];
                this.numForfeit[i] = 0;
                this.broadcastGameInfo();
                break;
            }
        }
        if(this.numForfeit.every(num => num == 0)){
            this.moveRobber = true;
            this.users[this.currentTurn].client.connnection.send(JSON.stringify({
                "game" : "move robber"
            }));
        }
    }

    updateLongestPath() : void {
        let user = -1
        let longest = 0;
        let numberOfUsers = 0;
        for(let i = 0; i < this.users.length; i++){
            if(this.longestRoads[i] >= 5){
                if(user == -1) user = i;
                else if(longest < this.longestRoads[i]){
                    numberOfUsers = 1;
                    user = i;
                    longest = this.longestRoads[i];
                }
                else if(longest == this.longestRoads[i]){
                    numberOfUsers++;
                }
            }
        }
        if(numberOfUsers == 1){
            if(this.currentLongestRoad != -1){
                this.users[this.currentLongestRoad].victoryPoints-=2;
                this.publicVictoryPoints[this.currentLongestRoad]-=2;
            }
            this.currentLongestRoad = user;
            this.users[this.currentLongestRoad].victoryPoints += 2;
            this.publicVictoryPoints[this.currentLongestRoad] += 2;
        }
        if((numberOfUsers > 1 && this.longestRoads[this.currentLongestRoad] < longest) || numberOfUsers == 0){
            if(this.currentLongestRoad != -1){
                this.users[this.currentLongestRoad].victoryPoints-=2;
                this.publicVictoryPoints[this.currentLongestRoad]-=2;
            }
            this.currentLongestRoad = -1;
        }
    }

    findLongestPathUser(user : number) : void{
        let longest = 0;
        this.users[user].nodes.forEach(node => {
            let longestStartingFromNode = this.board.getLongestPath(node, user);
            if(longestStartingFromNode > longest) longest = longestStartingFromNode;
        });
        this.longestRoads[user] = longest;
        this.updateLongestPath();
    }

    rollResources(roll : number) : void{
        this.board.getHexagonsByRoll(roll).forEach(hexagon => {
            if(hexagon.robber()) return;
            hexagon.getAllNodes().forEach(node => {
                if(node.getUser() == -1) return;
                this.users[node.getUser()].resources[hexagon.getResource() - 1] += node.getType();
                this.numOfResources[node.getUser()] += node.getType();
            });
        });
        this.broadcastGameInfo({"game" : "resources"});
    }

    rollDice(user : Client, errorCallback : (ws : any, message : string) => any) : void {
        if(this.roundType != 2){
            errorCallback(user.connnection, "Not correct round type");
            return;
        }
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        if(this.justRolled){
            errorCallback(user.connnection, "Already rolled dice this turn");
            return;
        }

        const dice = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
        this.justRolled = true;
        this.users.forEach(element => {
            element.client.connnection.send(JSON.stringify({
                "game" : "roll",
                "dice" : dice
            }));
        });

        if(dice == 7){
            this.robberForfeit();
        }
        else{
            this.rollResources(dice);
        }
    }

    addSettlement(user : Client, position : Array<number>, errorCallback : (ws : any, message : string) => any) : boolean{
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }

        if(this.users[this.currentTurn].pieces[1] == 0){
            errorCallback(user.connnection, "Not enough pieces");
            return false;
        }

        let resources = this.users[this.currentTurn].resources;
        
        if(resources[0] == 0 || resources[1] == 0 || resources[2] == 0 || resources[4] == 0){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }
        
        if(!this.board.validSettlement(position, false, this.users[this.currentTurn].nodes)){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }
        
        resources[0]--, resources[1]--, resources[2]--, resources[4]--;
        this.numOfResources[this.currentTurn] -= 4;

        let otherUser = this.board.breaksRoad(this.currentTurn, position);
        
        if(otherUser != -1){
            this.findLongestPathUser(otherUser);
        }

        let harbour = this.board.addSettlement(position, this.currentTurn);

        if(harbour != -1){
            this.users[this.currentTurn].harbour[harbour] = true;
        }

        this.users[this.currentTurn].victoryPoints++;
        this.publicVictoryPoints[this.currentTurn]++;
        this.users[this.currentTurn].pieces[1]--;

        this.broadcastGameInfo({
            "game" : "settlement",
            "user" : this.currentTurn,
            "position" : position
        });

        this.checkForWinner();

        return true;
    }

    upgradeSettlement(user : Client, position : Array<number>, errorCallback : (ws : any, message : string) => any) : boolean{
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }
        
        if(this.users[this.currentTurn].pieces[2] == 0){
            errorCallback(user.connnection, "Not enough pieces");
            return false;
        }

        if(this.users[this.currentTurn].resources[3] < 3 || this.users[this.currentTurn].resources[0] < 2){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }

        let hexagon = this.board.getHexagon(position[0], position[1]);

        if(hexagon == undefined){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }

        let node = hexagon.getNode(position[2]);
        if(node.getUser() != this.currentTurn){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }

        this.users[this.currentTurn].resources[3] -= 3;
        this.users[this.currentTurn].resources[0] -= 2;
        this.numOfResources[this.currentTurn] -= 5;

        node.setType(2);
        this.users[this.currentTurn].victoryPoints++;
        this.publicVictoryPoints[this.currentTurn]++;
        this.users[this.currentTurn].pieces[1]++;
        this.users[this.currentTurn].pieces[2]--;

        this.broadcastGameInfo({
            "game" : "upgrade",
            "user" : this.currentTurn,
            "position" : position
        });

        this.checkForWinner();

        return true;
    }

    addRoad(user : Client, position : Array<Array<number>>, errorCallback : (ws : any, message : string) => any) : boolean{
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }

        if(this.users[this.currentTurn].pieces[0] == 0){
            errorCallback(user.connnection, "Not enough pieces");
            return false;
        }

        let resources = this.users[this.currentTurn].resources;
        if(resources[1] == 0 || resources[4] == 0){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }

        if(!this.board.validRoad(this.users[this.currentTurn].nodes, position)){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }

        resources[1]--, resources[4]--;
        this.numOfResources[this.currentTurn] -= 2;

        let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
        let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];

        this.users[this.currentTurn].nodes.add(node[0]);
        this.users[this.currentTurn].nodes.add(node[1]);
        this.users[this.currentTurn].pieces[0]--;

        this.board.addRoad(position, this.currentTurn);

        this.findLongestPathUser(this.currentTurn);

        this.broadcastGameInfo({
            "game" : "road",
            "user" : this.currentTurn,
            "position" : position
        });
        return true;
    }

    startingPlacement(user : Client, settlement : Array<number>, road : Array<number> ,errorCallback : (ws : any, message : string) => any) : boolean{
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }
        if(this.roundType == 2){
            errorCallback(user.connnection, "Not early game");
            return false;
        }
        if(!this.board.validSettlement(settlement) || this.board.collisionRoad([settlement, road])){
            errorCallback(user.connnection, "Position is invalid");
            return false;
        }

        this.board.addSettlement(settlement, this.currentTurn);
        this.board.addRoad([settlement, road], this.currentTurn);
        this.users[this.currentTurn].nodes.add(this.board.getHexagon(settlement[0], settlement[1]).getNode(settlement[2]));
        this.users[this.currentTurn].nodes.add(this.board.getHexagon(road[0], road[1]).getNode(road[2]));
        
        if(this.roundType == 1){
            this.board.getHexagon(settlement[0], settlement[1]).getNode(settlement[2]).getAdjacentHexagons().forEach(hexagon => {
                if(hexagon.getResource() == 0) return;
                this.users[this.currentTurn].resources[hexagon.getResource() - 1]++;
                this.numOfResources[this.currentTurn]++;
            });
        }

        this.users[this.currentTurn].pieces[0]--;
        this.users[this.currentTurn].pieces[1]--;

        this.broadcastGameInfo({
            "game" : "early game placement",
            "user" : this.currentTurn,
            "settlement" : settlement,
            "road" : road
        });
        return true;
    }

    getCard(user : Client, errorCallback : (ws : any, message : string) => any) : boolean{
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return false;
        }
        
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return false;
        }
        if(this.users[this.currentTurn].resources[0] == 0 || this.users[this.currentTurn].resources[2] == 0 || this.users[this.currentTurn].resources[3] == 0){
            errorCallback(user.connnection, "Not enough resources");
            return false;
        }

        if(this.numOfRemainingCards.reduce((a, b) => a + b) == 0){
            errorCallback(user.connnection, "No cards available");
            return false;
        }

        this.users[this.currentTurn].resources[0]--;
        this.users[this.currentTurn].resources[2]--;
        this.users[this.currentTurn].resources[3]--;
        this.numOfResources[this.currentTurn] -= 3;

        let randomCard = Math.floor(Math.random() * 5);
        
        while(this.numOfRemainingCards[randomCard] == 0){
            randomCard = Math.floor(Math.random() * 5);
        }

        if(this.users[this.currentTurn].cards[randomCard] == 0){
            if(this.cantPlayCard == undefined) this.cantPlayCard = new Array(5).fill(false);
            this.cantPlayCard[randomCard] = true;
        }

        this.users[this.currentTurn].cards[randomCard]++;
        this.numOfCardsUsers[this.currentTurn]++;
        this.numOfRemainingCards[randomCard]--;
        
        if(randomCard == 1){
            this.users[this.currentTurn].victoryPoints++;
            this.checkForWinner();
        }

        this.broadcastGameInfo({
            "game" : "pickedUpCard"
        });
        return true;
    }

    playCard(user : Client, errorCallback : (ws : any, message : string) => any, cardNumber : number, additionalInformation?: { robberPosition? : Array<number>, monopoly? : number, resources? : Array<number>, road? : Array<Array<Array<number>>>}) : void{
        if(this.roundType != 2){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        if(this.cardPlayed){
            errorCallback(user.connnection, "Already played a card");
            return;
        }
        if(this.users[this.currentTurn].cards[cardNumber] == 0){
            errorCallback(user.connnection, "Not enough cards");
            return;
        }
        if(this.cantPlayCard != undefined && this.cantPlayCard[cardNumber]){
            errorCallback(user.connnection, "Cant play this card");
            return;
        }

        switch(cardNumber){
            case 0:{
                if(!isTypeArray(additionalInformation.robberPosition, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                if(!this.robberMove(user, additionalInformation.robberPosition, errorCallback)){
                    errorCallback(user.connnection, "Position is invalid");
                    return;
                }
                this.knights[this.currentTurn]++;
                if(this.knights[this.currentTurn] >= 3){
                    if(this.currentLargestArmy == -1 || this.knights[this.currentLargestArmy] > this.knights[this.currentTurn]) {
                        if(this.currentLargestArmy != -1){
                            this.publicVictoryPoints[this.currentLargestArmy] -= 2;
                            this.users[this.currentLargestArmy].victoryPoints -= 2;
                        }
                        this.publicVictoryPoints[this.currentTurn] -= 2;
                        this.users[this.currentTurn].victoryPoints -= 2;
                        this.currentLargestArmy = this.currentTurn;
                    }
                }
                break;
            }
            case 2:{
                if(typeof additionalInformation.monopoly != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                let totResources = 0;
                for(let i = 0; i < this.users.length; i++){
                    if(i == this.currentTurn) continue;
                    totResources += this.users[i].resources[additionalInformation.monopoly];
                    this.numOfResources[i] -= this.users[i].resources[additionalInformation.monopoly];
                    this.users[i].resources[additionalInformation.monopoly] = 0;
                }
                this.users[this.currentTurn].resources[additionalInformation.monopoly] += totResources;
                this.numOfResources[this.currentTurn] += totResources;
                break;
            }
            case 3:{
                if(!isTypeArray(additionalInformation.resources, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                this.numOfResources[this.currentTurn] += 2;
                this.users[this.currentTurn].resources[additionalInformation.resources[0]]++;
                this.users[this.currentTurn].resources[additionalInformation.resources[1]]++;
                break;
            }
            case 4:{
                if(additionalInformation.road == undefined){
                    errorCallback(user.connnection, "Invalid data");
                    return;
                }

                if(this.users[this.currentTurn].pieces[0] == 0){
                    errorCallback(user.connnection, "Not enough pieces");
                    return;
                }

                if(this.users[this.currentTurn].pieces[0] == 1){
                    let position = additionalInformation.road[0];
                    if(!this.board.validRoad(this.users[this.currentTurn].nodes, position)){
                        errorCallback(user.connnection, "Position is invalid");
                        return;
                    }

                    let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
                    let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];

                    this.users[this.currentTurn].nodes.add(node[0]);
                    this.users[this.currentTurn].nodes.add(node[1]);
                    this.users[this.currentTurn].pieces[0]--;

                    this.board.addRoad(position, this.currentTurn);

                    this.findLongestPathUser(this.currentTurn);

                    this.broadcastGameInfo({
                        "game" : "road",
                        "user" : this.currentTurn,
                        "position" : position
                    });
                    this.checkForWinner();
                }
                else{
                    let positions = additionalInformation.road;
                    if(this.board.validRoad(this.users[this.currentTurn].nodes, positions[0]) && this.board.validRoad(this.users[this.currentTurn].nodes, positions[1])){
                        positions.forEach(position => {
                            let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
                            let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];

                            this.users[this.currentTurn].nodes.add(node[0]);
                            this.users[this.currentTurn].nodes.add(node[1]);
                            this.users[this.currentTurn].pieces[0]--;

                            this.board.addRoad(position, this.currentTurn);

                            this.broadcastGameInfo({
                                "game" : "road",
                                "user" : this.currentTurn,
                                "position" : position
                            });
                        });
                        this.findLongestPathUser(this.currentTurn);
                        this.checkForWinner();
                    }
                    else {
                        if(this.board.collisionRoad(positions[0]) || this.board.collisionRoad(positions[1])){
                            errorCallback(user.connnection, "Position is invalid");
                            return;
                        }
                        if(this.board.validRoad(this.users[this.currentTurn].nodes, positions[0]) || this.board.validRoad(this.users[this.currentTurn].nodes, positions[1])){
                            let sharesCommon = false;
                            for(let i = 0; i < 2; i++){
                                for(let j = 0; j < 2; j++){
                                    if(this.board.getHexagon(positions[0][i][0], positions[0][i][1]).getNode(positions[0][i][2]) == this.board.getHexagon(positions[0][j][0], positions[0][j][1]).getNode(positions[0][j][2])){
                                        sharesCommon = true;
                                        break;
                                    }
                                }
                                if(sharesCommon) break;
                            }
                            if(!sharesCommon){
                                errorCallback(user.connnection, "Position is invalid");
                                return;
                            }
                            positions.forEach(position => {
                                let hexagons = [this.board.getHexagon(position[0][0], position[0][1]), this.board.getHexagon(position[1][0], position[1][1])];
                                let node = [hexagons[0].getNode(position[0][2]), hexagons[1].getNode(position[1][2])];
    
                                this.users[this.currentTurn].nodes.add(node[0]);
                                this.users[this.currentTurn].nodes.add(node[1]);
                                this.users[this.currentTurn].pieces[0]--;
    
                                this.board.addRoad(position, this.currentTurn);
    
                                this.broadcastGameInfo({
                                    "game" : "road",
                                    "user" : this.currentTurn,
                                    "position" : position
                                });
                            });
                            this.findLongestPathUser(this.currentTurn);
                            this.checkForWinner();
                        }
                        else{
                            errorCallback(user.connnection, "Position is invalid");
                            return;
                        }
                    }
                }
                break;
            }
            default : {
                errorCallback(user.connnection, "Invalid card number");
                return;
            }
        }

        this.cantPlayCard = undefined;
        this.cardPlayed = true;

        this.broadcastGameInfo({
            "game" : "card played",
            "card" : cardNumber
        });
    }

    marketTrade(user : Client, resources : Array<Array<number>>, errorCallback : (ws : any, message : string) => any) : void{
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        let defaultTrade = (this.users[this.currentTurn].harbour[0]) ? 3 : 4;
        let numResourcesTrading = resources[1].reduce((a, b) => a+b);
        let tradingAmount = 0;
        for(let i = 0; i < 5; i++){
            if(this.users[this.currentTurn].resources[i] < resources[0][i]){
                errorCallback(user.connnection, "Not enough resources");
                return;
            }
            if(resources[0][i] % ((this.users[this.currentTurn].harbour[i + 1]) ? 2 : defaultTrade) != 0){
                errorCallback(user.connnection, "Invalid number of resources");
                return;
            }
            tradingAmount += resources[0][i] / ((this.users[this.currentTurn].harbour[i + 1]) ? 2 : defaultTrade);
        }

        if(tradingAmount != numResourcesTrading){
            errorCallback(user.connnection, "Invalid number of resources");
            return;
        }

        for(let i = 0; i < 5; i++){
            this.users[this.currentTurn].resources[i] -= resources[0][i];
            this.numOfResources[this.currentTurn] -= resources[0][i];
            this.users[this.currentTurn].resources[i] += resources[1][i];
            this.numOfResources[this.currentTurn] += resources[1][i];
        }

        this.broadcastGameInfo({
            "game" : "market trade"
        });
    }

    userTrade(user : Client, resources : Array<Array<number>>, errorCallback : (ws : any, message : string) => any) : void {
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        for(let i = 0; i < 5; i++){
            if(this.users[this.currentTurn].resources[i] < resources[0][i]){
                errorCallback(user.connnection, "Not enough resources");
                return;
            }
        }
        this.currentTrade = [[...resources[0]], [...resources[1]]];
        this.tradeUser = new Array(this.users.length).fill(0);
        this.tradeUser[this.currentTurn] = -1;
        this.broadcastGameInfo({
            "game" : "trade request",
            "trade" : resources
        });
    }

    otherUserTrade(user : Client, accept : boolean, errorCallback : (ws : any, message : string) => any) : void{
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }
        
        if(this.isUserTurn(user)){
            errorCallback(user.connnection, "Cant respond to own trade request");
            return;
        }
        if(this.currentTrade == undefined){
            errorCallback(user.connnection, "No trades going on");
            return;
        }

        let userNum = -1;
        for(let i = 0; i < this.users.length; i++){
            if(this.users[i].client == user) userNum = i;
        }

        if(this.tradeUser[userNum] != 0){
            errorCallback(user.connnection, "Already confirmed trade");
            return;
        }

        if(!accept){
            this.tradeUser[userNum] = 2;
        }
        else{
            for(let i = 0; i < 5; i++){
                if(this.users[userNum].resources[i] < this.currentTrade[1][i]){
                    errorCallback(user.connnection, "Not enough resources");
                    return;
                }
            }
            this.tradeUser[userNum] = 1;
        }
        this.broadcastGameInfo({
            "game" : "trade status",
            "users" : this.tradeUser,
            "responded" : this.tradeUser.every(a => a != 0),
            "failed" : this.tradeUser.every(a => a != 0 && a != 1)
        });
    }

    acceptTrade(user : Client, otherUser : number, errorCallback : (ws : any, message : string) => any) : void{
        if(this.roundType != 2 || !this.justRolled){
            errorCallback(user.connnection, "Not right turn type");
            return;
        }

        if(!this.isUserTurn(user)){
            errorCallback(user.connnection, "Not your turn");
            return;
        }
        if(!this.tradeUser.some(a => a == 1)){
            errorCallback(user.connnection, "No trades available");
            return;
        }
        if(this.tradeUser[otherUser] != 1){
            errorCallback(user.connnection, "Invalid user selected");
            return;
        }
        for(let i = 0; i < 5; i++){
            this.users[this.currentTurn].resources[i] -= this.currentTrade[0][i];
            this.users[this.currentTurn].resources[i] += this.currentTrade[1][i];
            this.numOfResources[this.currentTurn] -= this.currentTrade[0][i] - this.currentTrade[1][i];
            this.users[otherUser].resources[i] -= this.currentTrade[1][i];
            this.users[otherUser].resources[i] += this.currentTrade[0][i];
            this.numOfResources[otherUser] -= this.currentTrade[1][i] - this.currentTrade[0][i];
        }
        this.currentTrade = undefined;
        this.tradeUser = undefined;
        this.broadcastGameInfo({
            "game" : "trade completed"
        });
    }
}

export default class Games{
    private games : Map<string, Game>;
    constructor(){
        this.games = new Map();
    }
    createGame(user : Client, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        if(user.joinedGame != undefined){
            errorCallback(user.connnection, "User already in a game");
            return;
        }
        let gameKey = uuidv4().slice(-5);
        while(this.games.has(gameKey)) gameKey = uuidv4().slice(-5);
        let game = new Game(user.guid, gameKey);
        game.joinGame(user);
        this.games.set(gameKey, game);
        successCallback(user.connnection, {
            "gamekey" : gameKey
        })
    }
    joinGame(gameKey : string, user : Client, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        if(user.joinedGame != undefined){
            errorCallback(user.connnection, "User already in a game");
            return;
        }
        if(!this.games.has(gameKey)){
            errorCallback(user.connnection, "Invalid game key");
            return;
        }
        let game = this.games.get(gameKey);
        if(game.isGameStarted()){
            errorCallback(user.connnection, "Game has already started");
            return;
        }
        if(game.joinGame(user)){
            let namesOfJoinedUsers = [];
            game.getUsers().forEach(element => {
                if(user.guid != element.client.guid)
                    namesOfJoinedUsers.push(element.client.name);
            });
            successCallback(user.connnection, {"joinedUsers" : namesOfJoinedUsers});
        }
        else{
            errorCallback(user.connnection, "Game is full");
        }
    }
    getJoinedGame(user : Client, errorCallback : (ws : any, message : string) => any) : Game {
        if(user.joinedGame == undefined){
            errorCallback(user.connnection, "No game joined");
            return undefined;
        }
        return this.games.get(user.joinedGame);
    }
    startCurrentGame(user : Client, errorCallback : (ws : any, message : string) => any) : void {
        let game = this.getJoinedGame(user, errorCallback);
        if(game != undefined){
            if(game.isGameOwner(user.guid)){
                if(!game.startGame()){
                    errorCallback(user.connnection, "Not enough users");
                } 
            }
            else{
                errorCallback(user.connnection, "Not game owner");
            }
        }
    }
    updateGame(user : Client, json : any, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        let game = this.getJoinedGame(user, errorCallback);
        if(game == undefined) return;
        if(!game.isGameStarted()){
            errorCallback(user.connnection, "Game not started");
            return;
        }
        if(json.game == undefined || (typeof json.game) != "string") {
            errorCallback(user.connnection, "Data invalid");
            return;
        }
        switch (json.game){
            case "startSettlement" : {
                if(!isTypeArray(json.settlement, "number") || !isTypeArray(json.road, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                if(game.startingPlacement(user, json.settlement, json.road, errorCallback))
                    game.endTurn(user, errorCallback);
                break;
            }
            case "dice" : {
                game.rollDice(user, errorCallback);
                break;
            }
            case "end" : {
                game.endTurn(user, errorCallback);
                break;
            }
            case "settlement" : {
                if(!isTypeArray(json.settlement, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.addSettlement(user, json.settlement, errorCallback);
                break;
            }
            case "city" : {
                if(!isTypeArray(json.settlement, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.upgradeSettlement(user, json.settlement, errorCallback);
                break;
            }
            case "road" : {
                if(!(json.road instanceof Array) || !isTypeArray(json.road[0], "number") || !isTypeArray(json.road[1], "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.addRoad(user, json.road, errorCallback);
                break;
            }
            case "forfeit" : {
                if(!isTypeArray(json.resources, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.forfeit(user, json.resources, errorCallback);
                break;
            }
            case "robber" : {
                if(!isTypeArray(json.position, "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.robberMove(user, json.position, errorCallback);
                break;
            }
            case "rob" : {
                if(typeof json.player != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.rob(user, json.player, errorCallback);
                break;
            }
            case "getCard" : {
                game.getCard(user, errorCallback);
                break;
            }
            case "playCard" : {
                if((typeof json.card) != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.playCard(user, errorCallback, json.card, json.additionalInformation);
                break;
            }
            case "marketTrade" : {
                if(!(json.resources instanceof Array) || !isTypeArray(json.resources[0], "number") || !isTypeArray(json.resources[1], "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.marketTrade(user, json.resources, errorCallback);
                break;
            }
            case "userTrade" : {
                if(!(json.resources instanceof Array) || !isTypeArray(json.resources[0], "number") || !isTypeArray(json.resources[1], "number")){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.userTrade(user, json.resources, errorCallback);
                break;
            }
            case "otherUserTrade" : {
                if(typeof json.accept != "boolean"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.otherUserTrade(user, json.accept, errorCallback);
                break;
            }
            case "acceptTrade" : {
                if(typeof json.otherUser != "number"){
                    errorCallback(user.connnection, "Data invalid");
                    return;
                }
                game.acceptTrade(user, json.otherUser, errorCallback);
                break;
            }
            default : {
                errorCallback(user.connnection, "Command invalid");
                break;
            }
        }

    }
}