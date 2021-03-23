interface Client {
    name: String,
    guid: String,
    connnection: any
}

export default class Clients {
    clientMap: Map<String, Client>;
    constructor(){
        this.clientMap = new Map();
        this.saveClient = this.saveClient.bind(this);
        this.getClient = this.getClient.bind(this);
    }
    getClient(guid : String) : Client{
        return this.clientMap.get(guid);
    }
    saveClient(name : String, guid : String, connection : any) : void{
        this.clientMap.set(guid, {
            name: name,
            guid: guid,
            connnection: connection
        });
    }
    removeClient(guid : String) : boolean {
        return this.clientMap.delete(guid);
    }
}