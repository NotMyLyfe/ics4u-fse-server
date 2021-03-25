import Board from './board';
import { Client } from './clients';
import { v4 as uuidv4 } from 'uuid';

enum GameConst{
    MAX_PLAYERS = 4,
    MIN_PLAYERS = 3
}

interface gamePlayer {
    client : Client,
    resources : Array<number>,
    victoryPoints : number
}

class Game{
    private users : Array<gamePlayer>;
    private board : Board;
    private gameStarted : boolean;
    private gameKey : string;
    private gameOwner : string;

    constructor(gameOwner : string){
        this.users = new Array();
        this.board = new Board();
        this.gameStarted = false;
        this.gameKey = uuidv4().slice(-5);
        this.gameOwner = gameOwner;
    }
    isGameOwner(userId : string) : boolean {
        return userId === this.gameOwner;
    }
    isGameStarted() : boolean {
        return this.gameStarted;
    }
    startGame() : boolean{
        if(this.users.length < GameConst.MIN_PLAYERS) return false;
        this.users.forEach(element => {
            element.client.connnection.send(JSON.stringify({
                "game" : "started"
            }));
        });
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
            victoryPoints : 0
        });
        user.joinedGame = this.gameKey;
        return true;
    }  
    getKey() : string{
        return this.gameKey;
    }
    getUsers() : Array<gamePlayer> {
        return this.users;
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
        let game = new Game(user.guid);
        game.joinGame(user);
        this.games.set(game.getKey(), game);
        successCallback(user.connnection, {
            "gamekey" : game.getKey()
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
    playGame(user : Client, json : any, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        let game = this.getJoinedGame(user, errorCallback);
        if(game == undefined) return;
        if(game.isGameStarted){
            errorCallback(user.connnection, "Game not started");
            return;
        }
    }
}