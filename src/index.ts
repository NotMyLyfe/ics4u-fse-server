// index.ts
// Gordon Lin
// Main WebSocket server application used for connecting, handshaking, and general connections to the WebSocket server

// External module exports
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';
import * as url from 'url';

// Imports from classes
import Clients from "./helpers/clients";
import Games from "./helpers/games";
import expressRouting from './expressRouting';

// Creation of class for storing the clients and games
const clients = new Clients;
const games = new Games;

// Functions used for heartbeat (checking if connection is alive)
function noop(){}
function heartbeat(this: any) {
    this.isAlive = true;
}

// Creation of the WebSocket server object
const wss = new WebSocket.Server({noServer: true});

// Creation of HTTP server, used for handshaking the WebSocket connection
const httpServer = http.createServer(expressRouting);

// Prints error upon HTTP server error
httpServer.on('error', function(err){
    console.error(err);
})

// Action when web server is listening to port specified
httpServer.on('listening', function() {
    console.log("Web server is listening!");
})

// Action upon client handshaking the server and requesting a WebSocket connection over HTTP
httpServer.on('upgrade', function(req, socket, head){
    // Gets the path of HTTP request
    const pathname = url.parse(req.url).pathname;
    
    // Checks if the path matches the one specified for the WebSocket request
    if(pathname === '/websocket/catan'){
        // Calls WebSocket server to handle websocket request and handle the handshake
        wss.handleUpgrade(req, socket, head, function done(ws){
            wss.emit("connection", ws);
        })
    }
    else {
        // Closes connection as path is invalid for websocket request
        socket.destroy();
    }
})

// Specifies the HTTP server to listen on Port 8080
httpServer.listen(8080);

// Callback functions, used to send user data regarding successful and failure of data being sent to server
// errorCallback - sends back a string only with the error message with key "error" in a JSON
function errorCallback(ws : any, errorMessage : string) : void{
    ws.send(JSON.stringify({
        "error" : errorMessage
    }));
}
// successCallback - sends back "success" with key "result", along with a JSON of any additional data
function successCallback(ws : any, message : any) : void{
    message["result"] = "success";
    ws.send(JSON.stringify(message));
}

// Upon connection from client to the WebSocket server
wss.on('connection', (ws : any) => {
    // Sets property 'isAlive' to true, as the connection is live
    ws.isAlive = true;

    // Generates unique identifier for the user, assigns it to the user, and sends it back to the user
    const clientId = uuidv4();
    ws.clientId = clientId;
    ws.send(JSON.stringify({
        guid: clientId
    }));

    // Saves the client data in the clients object, with the user's name, guid, and websocket connection object
    clients.saveClient("Player", clientId, ws);

    // If the connection request is checking if the connection is alive (ping/pong request), calls heartbeat function to set websocket to alive
    ws.on('pong', heartbeat);
    
    // If the connection request is a message
    ws.on('message', (message: any) => {
        try{
            // Parses the message from string format into a JSON
            const json = JSON.parse(message);
            
            switch(json.action){
                // If the action requested is to change the user's name
                case "name" : {
                    // Sends error back to user if the user did not specify a name to change to
                    if(json.name == undefined){
                        errorCallback(ws, "No name specified");
                        break;
                    }
                    // Updates the client's data in the clients object with the user's name
                    clients.updateClient(ws.clientId, "name", json.name, errorCallback, successCallback);
                    break;
                }
                // If the action requested is creating a new Catan game
                case "create" : {
                    // Calls createGame method in the games object, which includes the user's client object, and the success/error callbacks
                    games.createGame(clients.getClient(ws.clientId), errorCallback, successCallback);
                    break;
                }
                // If the action requested is joining a game
                case "join" : {
                    // Checks if the user included a gamekey
                    // if not, sends back an error saying that there's no key specified
                    if(json.gamekey == undefined){
                        errorCallback(ws, "No game key specified");
                        break;
                    }
                    // Calls joinGame method, passing in the gamekey and the user's client object, along side the success/error callbacks
                    games.joinGame(json.gamekey, clients.getClient(ws.clientId), errorCallback, successCallback);
                    break;
                }
                // If the action requested is starting a game
                case "start" : {
                    // Calls startCurrentGame method, passing in the user's client object, along side the error callback
                    games.startCurrentGame(clients.getClient(ws.clientId), errorCallback);
                    break;
                }
                // If the action requested is regarding the game (any updates regarding the game)
                case "game" : {
                    // Calls updateGame with the user's client object, and the whole websocket message data, along side the success/error callbacks
                    games.updateGame(clients.getClient(ws.clientId), json, errorCallback, successCallback);
                    break;
                }
                // If the action message has not found, probably not a valid command, and sends back an error saying that the command is invalid
                default : {
                    errorCallback(ws, "Invalid command");
                }
            }
        }
        // If unable to parse JSON and get message, possibly an invalid message
        catch(error){
            // Sends back an error saying message is invalid
            errorCallback(ws, "Invalid message");
        }
    });
    
    // If the connection is being closed
    ws.on('close', ()=>{
        // Calls the removeUser method from games to remove the user from their joined games
        games.removeUser(clients.getClient(ws.clientId));
        // Calls removeClient from clients to remove the user from the list of clients
        clients.removeClient(ws.clientId);
    });
});

// Function that constantly checks if the connection is alive every 3 seconds
const interval = setInterval(() => {
    // Loops through all the connected clients to the websocket server
    wss.clients.forEach((ws : any) => {
        // Checks if their connection isn't alive, and terminates their connection
        if(ws.isAlive === false) {
            return ws.terminate();
        }
        // Sets isAlive to false, and pings clients
        ws.isAlive = false;
        ws.ping(noop);
    });
}, 3000);

// Upon server close, stops the heartbeat
wss.on('close', () => {
    clearInterval(interval);
});
