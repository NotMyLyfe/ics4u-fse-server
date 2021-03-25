export interface Client {
    name: string,
    guid: string,
    connnection: any,
    joinedGame : string
}

export default class Clients {
    private clientMap: Map<string, Client>;
    constructor(){
        this.clientMap = new Map();
    }
    getClient(guid : string) : Client{
        return this.clientMap.get(guid);
    }
    saveClient(name : string, guid : string, connection : any) : void{
        this.clientMap.set(guid, {
            name: name,
            guid: guid,
            connnection: connection,
            joinedGame : undefined
        });
    }
    removeClient(guid : string) : boolean {
        return this.clientMap.delete(guid);
    }
    updateClient(guid : string, key : string, value : string, errorCallback : (ws : any, message : string) => any, successCallback : (ws : any, additional : any) => any) : void{
        try{
            this.clientMap.get(guid)[key] = value;
            successCallback(this.clientMap.get(guid).connnection, {});
        }
        catch(err){
            errorCallback(this.clientMap.get(guid).connnection, err);
        }
    }
}