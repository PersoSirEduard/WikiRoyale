const request = require('request');
const url = require('url');
const cheerio = require('cheerio');
const { link } = require('fs');

class Game {

    constructor(session) {
        // Setup
        this.state = "lobby";
        this.master = "";
        this.currentLvl = 1;
        this.objectives = {};

        setInterval(() => {this.gameLoop(session)}, 50); // Game loop
    }

    onConnection(session, ws, request) {

        // Will only accept connections when in the lobby state

        console.log(`${ws.username} joined the session ${session.name}.`)

        // First player becomes master
        if (session.getClientCount() == 1) {
            this.master = session.getClientAddress(ws);
            session.send(ws, "set_role", "master");
        }

        switch(this.state) {
            case "lobby":
                session.send(ws, "set_state", "lobby");
                session.sendAll("lobby_update", JSON.stringify(this.getListPlayers(session)));
                break;
        }

    }

    async onMessage(session, ws, request, message) {
        var data = {command: "", value: ""}; // Default value

        try {
            // Try to avoid crashing server for invalid formats
            var data = JSON.parse(message);
        } catch (ex) {
            // Ignore
        }

        console.log(data)
        switch(data.command) {

            case "kick": // Kick is a lobby command
                if (this.state == "lobby") {
                    var playerIP = session.getClientAddress(ws);
                    
                    if (playerIP === this.master) { // Verify if the player is the master of the session
                        var playerToKick = data.value;
                        // Search for player to kick
                        for (const client of session.socket.clients) {
                            
                            if (playerToKick === client.username) {
                                // Force kick player
                                session.send(client, "disconnect", "You got kicked by the server.");
                                // Create error client
                                // client._socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                                client.close(); // Close player socket
                                break;
                            }
                        }
                    }
                }
                break;

            // Start game 'lobby' -> 'playing_idle'
            case "start_game":
                if (this.state == "lobby") {
                    var playerIP = session.getClientAddress(ws);

                    if (playerIP === this.master) { // Verify if the player is the master of the session
                        this.state = 'playing_idle'; // Playing state
                        session.sendAll("set_state", "playing_idle");
                        
                        var objectives = await this.getWikiObjectives(3);
                        this.objectives = objectives;

                        session.sendAll("wiki_objectives", JSON.stringify(this.objectives));
                    }
                }
                break;

            // Ignore
            default:
                break;
        }

    }

    onClose(session, ws, request) {

        console.log(`${ws.username} left the session ${session.name}.`)

        // Get new master
        if (this.master === session.getClientAddress(ws)) {
            
            if (session.getClientCount() == 0) {
                // No more players left
                session.endSession();
            } else {
                // Choose new player as master
                var newMaster = null;

                // This is the only immediate way I found for doing this
                // and, yes i know, its not optimal, but it works
                for (const client of session.socket.clients) {
                    newMaster = client;
                    break;
                }

                this.master = session.getClientAddress(newMaster);
                // Send update to new master
                session.send(newMaster, "set_role", "master");
            }
        } else {
            
            if (session.getClientCount() == 0) {
                session.endSession();
            }
        }

        switch(this.state) {
            case "lobby":
                session.sendAll("lobby_update", JSON.stringify(this.getListPlayers(session)));
                break;
        }

    }

    gameLoop(session) {

    }

    getListPlayers(session) {
        var players = []
        for (const client of session.socket.clients) {
            players.push(client.username);
        }
        return players;
    }

    async getPage(url) {
        return new Promise((resolve, reject) => {
            request(url, function (error, response, body) {
                if (error) reject(error);
                resolve({response, body});
            });
        });
    }

    async getWikiObjectives(difficulty = 1) {
        var page = await this.getPage('https://en.wikipedia.org/wiki/Special:Random');
        var initial = page.response.request.uri.href
        
        var destination = initial;
        for (var level = 0; level < difficulty; level++) {

            var desPage = await this.getPage(destination);

            const $ = cheerio.load(desPage.body);

            var links = [];
            $('#mw-content-text a').filter((i, link) => {
                var href = link.attribs.href;
                if (href != undefined && href.includes('/wiki/') && !href.includes("https://") && !href.includes("File:") && !href.includes("Special:") && !href.includes("Help:") && !href.includes("Wikipedia:")) {
                    links.push(href)
                }
            })

            destination = 'https://en.wikipedia.org' + links[Math.floor(Math.random() * links.length)];
            
        }

        return {initial, destination};
    }
}

module.exports = { Game }