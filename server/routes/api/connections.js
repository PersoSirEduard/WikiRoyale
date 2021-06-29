const { Session, existingPort, getRandomInt } = require('../../helpers/session');
const url = require('url');

const MAX_SESSIONS = 5;

var sessions = [];

// Removes empty sessions
const sessionCleaner = setInterval(() => {

    for (session of sessions) {
        // Check if session is still alive
        if (session.getClientCount() == 0) {

            // Disconnect and close socket
            session.endSession();

            removeSession(session);
        }
    }
}, 30000);

function removeSession(session) {
    // Remove from sessions array
    console.log(`Session ${session.name} ended.`)
    var index = sessions.indexOf(session);
    sessions.splice(index, 1);
}

module.exports = (app, server) => {

    // Create a new game session
    app.post('/api/new_game', (req, res) => {

        // Verify if the server is full
        if (sessions.length >= MAX_SESSIONS) {
            // Server is full
            return res.send({ success: false, message: 'There are too many game sessions running right now. Come back later!'});
        }

        // Create new session
        var newSession = new Session(removeSession);
        sessions.push(newSession);
        console.log(`Created session ${newSession.name}.`);

        // Return game session info
        return res.send({ session: newSession.name });

    });

    server.on('upgrade', function upgrade(request, socket, head) {
        // Get pathname or name of the session
        const pathname = url.parse(request.url).pathname;

        // Search for available session and connect user if it exists
        for (session of sessions) {
            if (pathname === session.getPathname()) {
                session.socket.handleUpgrade(request, socket, head, function done(ws) {

                    // Authentication
                    if (!session.authenticate(request, socket)) {
                        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                        socket.destroy()
                        return;
                    }
                    
                    session.socket.emit('connection', ws, request);

                });
                return;
            }
        }

        // Session does not exist
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        
    });
}