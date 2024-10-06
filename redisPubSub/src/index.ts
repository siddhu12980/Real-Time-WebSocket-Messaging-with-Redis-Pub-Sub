import { startWebSocketServer } from "./ws";


function startServers() {
startWebSocketServer(8081);
  startWebSocketServer(8082);
}

startServers();
