import Board from './board';
import { v4 as uuidv4 } from 'uuid';

enum GameConst{
    MAX_PLAYERS = 4,
    MIN_PLAYERS = 3
}

interface gamePlayer {
    name : string,
    guid : string,
    resources : Array<number>,
    victoryPoints : number

}

export default class Games{
    private users : Array<gamePlayer>;
    private board : Board;
    private gameStarted : boolean;
    private gameKey : string;
    constructor(){
        this.users = new Array();
        this.board = new Board();
        this.gameStarted = false;
        this.gameKey = uuidv4().slice(-5);
    }
    startGame() : boolean{
        if(this.users.length < GameConst.MAX_PLAYERS) return false;
        return this.gameStarted = true;
    }
    joinGame() : boolean {
        if(this.users.length >= GameConst.MIN_PLAYERS) return false;
        return true;
    }   
}