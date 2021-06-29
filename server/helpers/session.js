const WebSocket = require('ws');
const random = require("random-string-generator");
const { Game } = require('./game');
const url = require('url');

class Session {
    constructor(removeSessionEvent = () => {}, maxConnections = 10) {

        // Genreate a new random name
        this.name = random(10);

        // Setup max players
        this.maxConnections = maxConnections;

        // Create new game instance
        this.game = new Game(this);

        // Create timeout for AFK sessions
        this.timeout = null;
        this.newTimeOut();

        // Create a new server socket
        this.socket = new WebSocket.Server({ noServer: true });

        this.socket.on('connection', (ws, request) => {

            var params = url.parse(request.url, true).query;
            ws.username = params.user;

            this.newTimeOut(); // Reset timeout

            this.game.onConnection(this, ws, request);
            
            // User messaged
            ws.on('message', (message) => {

                this.newTimeOut(); // Reset timeout

                this.game.onMessage(this, ws, request, message);
                
            });

            // Player disconnected
            ws.on('close', () => {

                this.newTimeOut(); // Reset timeout

                this.game.onClose(this, ws, request);

                ws.terminate();
            });

        });

        // Session ended
        this.socket.on('close', () => {
            removeSessionEvent(this);
        });
    }

    endSession() {
        for(const client of this.socket.clients) {
            client.close();
        }
    }

    newTimeOut() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            console.log(`Session ${this.name} has timed out.`)
            this.endSession();
        }, 600000); // Max 10 mins of inactivity
    }

    getClientAddress(request) { // using request
        return `${request.socket.remoteAddress}:${request.socket.remotePort}`;
    }

    getClientAddressWS(ws) {
        return `${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
    }

    getClientCount() {
        return this.socket.clients.size;
    }

    getName() { // Return name of session
        return this.name;
    }

    getPathname() {
        return `/session/${this.name}`;
    }

    authenticate(request, socket) {

        // Verify if place is available for player
        if (this.getClientCount() >= this.maxConnections) {
            return false;
        }

        // Can only join when in the lobby
        if (this.game.state != "lobby") {
            return false;
        }

        var params = url.parse(request.url, true).query;

        // Username verification
        if (params.user) {

            // Verify for username length
            if (params.user.length == 0 && params.user.length > 15) {
                return false;
            }

            // Verify for username doubles
            for (const client of this.socket.clients) {
                if (client.username === params.user) {
                    return false;
                }
            }

        } else {
            return false;
        }

        return true;
    }

    send(ws, command, value) {
        this.newTimeOut();
        ws.send(JSON.stringify({command: command, value: value}));
    }

    sendAll(command, value) {
        this.newTimeOut();
        for (const client of this.socket.clients) {
            this.send(client, command, value);
        }
    }

}

module.exports = { Session }