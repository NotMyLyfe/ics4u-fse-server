// client.ts
// Gordon Lin
// Contains class that has Client interface, which stores information about the user, and a map of all the connected Clients

// Interface of each Client which contains the name of the user, their globally unique identifier, their WebSocket connection, and their joined game
export interface Client {
    name: string,
    guid: string,
    connnection: any,
    joinedGame : string
}

// Class which mainly stores all the Client interfaces into a map, mapped by their guid, with methods that gets, saves, removes, and updates each Client in the map
export default class Clients {
    // Map which stores all the Client interfaces, mapped by their guid
    private clientMap: Map<string, Client>;
    // Constructor which just intializes the map
    constructor(){
        this.clientMap = new Map();
    }

    // Getter method which gets the Client based on their guid
    getClient(guid : string) : Client{
        return this.clientMap.get(guid);
    }
    // Method which saves a new client into the Map of clients, with the user's name, guid, and WebSocket connection
    saveClient(name : string, guid : string, connection : any) : void{
        // Sets their guid with a new Client, with the specified parameters of the method
        // joinedGame is undefined as no game is joined yet
        this.clientMap.set(guid, {
            name: name,
            guid: guid,
            connnection: connection,
            joinedGame : undefined
        });
    }
    // Method which removes a client from the map based on their guid
    removeClient(guid : string) : boolean {
        return this.clientMap.delete(guid);
    }
    // Method which updates a client's value, using their guid, the key and value to update, with callbacks for success or failure
    updateClient(guid : string, key : string, value : string, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        try{
            // Tries to get a client from the map, and up the value at the index of their key
            this.clientMap.get(guid)[key] = value;
            // Calls success callback with the user's connection, and a successful callback, telling user that the client has been updated with their key and value
            successCallback(this.clientMap.get(guid).connnection, {
                "client" : "updated",
                "key" : key,
                "value" : value
            });
        }
        catch(err){
            // Errored occured and tells the user that an error and that they can't update a value
            errorCallback(this.clientMap.get(guid).connnection, "Can't update value");
        }
    }
}
