import { startWebSocketServer } from "./ws";

import dotenv from "dotenv"
dotenv.config();

function startServers() {
  startWebSocketServer(parseInt(process.env.PORT!));
}

startServers();
