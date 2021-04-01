import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import Clients  from "./helpers/clients";
import Games from "./helpers/games";
import * as http from 'http';
import * as url from 'url';

import expressRouting from './expressRouting';

const clients = new Clients;
const games = new Games;

function noop(){}
function heartbeat(this: any) {
    this.isAlive = true;
}

const wss = new WebSocket.Server({noServer: true});

const httpServer = http.createServer(expressRouting);

httpServer.on('error', function(err){
    console.error(err);
})

httpServer.on('listening', function() {
    console.log("Web server is listening!");
})

httpServer.on('upgrade', function(req, socket, head){
    const pathname = url.parse(req.url).pathname;
    
    if(pathname === '/websocket/path'){
        wss.handleUpgrade(req, socket, head, function done(ws){
            wss.emit("connection", ws);
        })
    }
    else {
        socket.destroy();
    }
})

httpServer.listen(8080);

function errorCallback(ws : any, errorMessage : string) : void{
    ws.send(JSON.stringify({
        "error" : errorMessage
    }));
}

function successCallback(ws : any, message : any) : void{
    message["result"] = "success";
    ws.send(JSON.stringify(message));
}

wss.on('connection', (ws : any) => {
    ws.isAlive = true;

    const clientId = uuidv4();
    
    ws.clientId = clientId;
    ws.send(JSON.stringify({
        guid: clientId
    }));
    clients.saveClient("Player", clientId, ws);

    ws.on('pong', heartbeat);
    
    ws.on('message', (message: any) => {
        console.log('received: %s', message);
        const json = JSON.parse(message);
        switch(json.action){
            case "name" : {
                if(json.name == undefined){
                    errorCallback(ws, "No name specified");
                    break;
                }
                clients.updateClient(ws.clientId, "name", json.name, errorCallback, successCallback);
                break;
            }
            case "create" : {
                games.createGame(clients.getClient(ws.clientId), errorCallback, successCallback);
                break;
            }
            case "join" : {
                if(json.gamekey == undefined){
                    errorCallback(ws, "No game key specified");
                    break;
                }
                games.joinGame(json.gamekey, clients.getClient(ws.clientId), errorCallback, successCallback);
                break;
            }
            case "start" : {
                games.startCurrentGame(clients.getClient(ws.clientId), errorCallback);
                break;
            }
            case "game" : {
                games.updateGame(clients.getClient(ws.clientId), json, errorCallback, successCallback);
                break;
            }
            default : {
                errorCallback(ws, "Invalid command");
            }
        }
    });
    
    ws.on('close', ()=>{
        games.removeUser(clients.getClient(ws.clientId));
        clients.removeClient(ws.clientId);
        console.log('connection closed');
    });
    
    
});

const interval = setInterval(() => {
    wss.clients.forEach((ws : any) => {
        if(ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(noop);
    });
}, 3000);

wss.on('close', () => {
    clearInterval(interval);
});