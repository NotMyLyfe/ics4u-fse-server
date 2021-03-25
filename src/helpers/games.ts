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
    cards : Array<number>
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

class Game{
    private users : Array<gamePlayer>;
    private board : Board;
    private gameStarted : boolean;
    private gameKey : string;
    private gameOwner : string;
    private currentTurn : number;
    private roundType : number;
    private justRolled : boolean;
    private moveRobber : boolean;
    private cardPlayed : boolean;

    constructor(gameOwner : string, gameKey : string){
        this.users = new Array();
        this.board = new Board();
        this.gameStarted = false;
        this.gameKey = gameKey;
        this.gameOwner = gameOwner;
        this.currentTurn = 0;
        this.roundType = 0;
        this.justRolled = false;
        this.moveRobber = false;
        this.cardPlayed = false;
    }
    getKey() : string{
        return this.gameKey;
    }
    getUsers() : Array<gamePlayer> {
        return this.users;
    }
    getGameWinner() : number{
        for(let i = 0; i < this.users.length; i++){
            if(this.users[i].victoryPoints >= 10) return i;
        }
        return -1;
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
    startGame() : boolean{
        if(this.users.length < GameConst.MIN_PLAYERS) return false;
        shuffle(this.users);
        for(let i = 0; i < this.users.length; i++){
            this.users[i].client.connnection.send(JSON.stringify({
                "game" : "started",
                "hexagons" : this.board.getAllHexagons(),
                "harbours" : this.board.getAllHarbours(),
                "turn" : i  
            }));
        }
        return this.gameStarted = true;
    }
    joinGame(user : Client) : boolean {
        if(this.users.length >= GameConst.MAX_PLAYERS) return false;
        this.users.forEach(element => {
            element.client.connnection.send(JSON.stringify({
                "message" : `${user.name} has joined the game`
            }));
        });
        this.users.push({
            client : user,
            resources : [0, 0, 0, 0, 0],
            victoryPoints : 0,
            nodes : new Set(),
            harbour : [false, false, false, false, false, false],
            cards : [0, 0, 0, 0]
        });
        user.joinedGame = this.gameKey;
        return true;
    }
    
    endTurn() : void {
        if(this.roundType == 0){
            if(this.currentTurn == this.users.length) this.roundType++;
            else this.currentTurn++;
        }
        else if(this.roundType == 1){
            if(this.currentTurn == 0) this.roundType++;
            else this.currentTurn--;
        }
        else{
            this.currentTurn++;
        }
        this.users.forEach(element => {
            element.client.connnection.send(JSON.stringify({
                "game" : "turn end",
                "turn" : this.currentTurn,
                "round" : this.roundType
            }))
        });
    }


    rollResources(roll : number) : void{
        this.board.getHexagonsByRoll(roll).forEach(hexagon => {
            if(hexagon.robber()) return;
            hexagon.getAllNodes().forEach(node => {
                if(node.getUser() == -1) return;
                this.users[node.getUser()].resources[hexagon.getResource()] += node.getType();
            });
        });
    }

    rollDice(user : Client, errorCallback : (ws : any, message : string) => any) : void {
        if(this.roundType != 3){
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
        if(dice == 7){
            this.moveRobber = true;
        }
        else{
            this.rollResources(dice);
        }
        this.justRolled = true;
        this.users.forEach(element => {
            element.client.connnection.send(JSON.stringify({
                "game" : "roll",
                "dice" : dice
            }));
        })
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
        if(game.isGameStarted){
            errorCallback(user.connnection, "Game not started");
            return;
        }
    }
}