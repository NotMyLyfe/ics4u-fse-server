import Board from './board';

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
    constructor(){
        this.users = new Array();
        this.board = new Board();
        this.gameStarted = false;
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