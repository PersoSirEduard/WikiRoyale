
// Game variables
var state = "lobby";
var role = "user";
var username = "";
var socket = false;

function setup(params) {

    // Username setup
    updateUsername(params.user);

}

// Send message to server
function sendMsg(command, message) {
    if (socket) {
        socket.send(JSON.stringify({command: command, value: message}));
    }
}

// Update welcome user message
function updateUsername(user) {
    username = user;
    if (state == "lobby") {
        // Update welcome message
        document.getElementById('welcome-user').innerHTML = `Welcome, ${username}!`
    }
    
}

function updateRole(_role) {
    role = _role;
    if (state == "lobby") {
        if (role == "master") {
            // Enable master message
            document.getElementById('role-msg').style.display = 'block';
            document.getElementById('begin-btn').style.display = 'block';
        } else if (role == "user") {
            // Disable master message
            document.getElementById('role-msg').style.display = 'none';
            document.getElementById('begin-btn').style.display = 'none';
        }
    }
}

// Kick player from lobby
function kickPlayer(player) {
    if (state == "lobby") {
        sendMsg("kick", player);
    }
}

// Update lobby players list
function updateLobby(players) {
    if (state == "lobby") {
        var list = document.getElementById('player-list')

        // Clear players list
        list.innerHTML = ""

        // Add new players list
        for (const player of players) {
            if (player == username) continue; // Ignore self
            var elem = document.createElement('div')
            elem.className = "list-box-item"
            elem.ondblclick = function() {
                kickPlayer(player);
            }
            elem.innerHTML = `<p>${player}</p>`
            list.appendChild(elem)
        }
    }
    
}

// Ready to begin the game
function onClick_BeginBtn() {
    if (role == "master") {
        sendMsg("start_game", "true");
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    // Get url params
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    
    // Create new websocket
    try {
        socket = new WebSocket(`ws://${SERVER_IP}session/${params.join}?user=${params.user}`, "protocolOne");
    } catch (err) { 
        console.log(err);
    }
    
    // On open event
    socket.onopen = function (event) {
        
    };

    // On message event
    socket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        console.log(data);
        switch(data.command) {

            // Update players list on lobby state
            case "lobby_update":
                updateLobby(JSON.parse(data.value));
                break;

            // Set player role in the session (master, user)
            case "set_role":
                // In lobby add extra button
                updateRole(data.value);
                break;

            // Unknown command
            default:
                break;
        }
    };

    // On error event
    socket.onerror = function(event) {
        // Disable game container and display error
        document.getElementById('valid-container').style.display = 'none';
        document.getElementById('error-container').style.display = 'block';
        document.getElementById('error-msg').innerHTML = "Error: Could not connect to the server or the session is invalid.";
    }

    // On close event
    socket.close = function(event) {
        // Disable game container and display error
        document.getElementById('valid-container').style.display = 'none';
        document.getElementById('error-container').style.display = 'block';
        document.getElementById('error-msg').innerHTML = "Oups, it seems that you got disconnected.";

    }

    // Begin setup
    setup(params);

});