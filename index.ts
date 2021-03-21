import { createServer } from "http";
import { server } from "websocket";
import { v4 as uuidv4 } from "uuid";

const httpServer = createServer();
const PORT = 9090;

httpServer.listen(PORT, ()=>{
    console.log(`Listening on ${PORT}`)
});

const wsServer = new server({
    "httpServer" : httpServer
});

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    connection.on("close", () => {
        console.log("closed!")
    });
    connection.on("message", message => {
        console.log(message);
    });

    const clientId = uuidv4();
    connection.send(clientId);
});
