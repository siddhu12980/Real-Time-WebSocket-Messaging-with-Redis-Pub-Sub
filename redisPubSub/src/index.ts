
import { startWs1 } from './ws1';
// import { startWs2 } from './ws2';

function startServers() {
    startWs1();  
    // startWs2( 'user2', 'room1'); 
}

startServers();
