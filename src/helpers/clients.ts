interface Client {
    name: string,
    guid: string,
    connnection: any,
    joinedGame : boolean
}

export default class Clients {
    private clientMap: Map<string, Client>;
    constructor(){
        this.clientMap = new Map();
        this.saveClient = this.saveClient.bind(this);
        this.getClient = this.getClient.bind(this);
    }
    getClient(guid : string) : Client{
        return this.clientMap.get(guid);
    }
    saveClient(name : string, guid : string, connection : any) : void{
        this.clientMap.set(guid, {
            name: name,
            guid: guid,
            connnection: connection,
            joinedGame : false
        });
    }
    removeClient(guid : string) : boolean {
        return this.clientMap.delete(guid);
    }
    updateClient(guid : string, key : string, value : string) : void{
        this.clientMap.get(guid)[key] = value;
    }
}