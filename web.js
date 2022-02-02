const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server, Socket } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/public_html'))

// const fs = require("fs");
// fs.readFile('users.txt', 'utf-8', (err, userdata) => {
//     if (err) {
//         console.log(err); return;
//     }
//     // do initial parse of userdata.
// });

/*
UTILITY FUNCTIONS:
*/
/**
 * Checks if a given username is valid.
 * i.e. it is within 1 and 20 characters and contains only letters, numbers, and underscores.
 * @param {string} user Username to check
 * @returns true if the user is valid or an error reason if it is not.
 */
function usernameIsValid(user) {
    if (user.length < 1 || user.length > 20) {
        return "Your username must be between 1 and 20 characters";
    }
    // a username is valid if it is between 1 and 20 characters and is composed of the following letters
    const validLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    for (let i = 0; i < user.length; i++) {
        if (!validLetters.includes(user.charAt(i))) {
            return "Your username can only contain letters, numbers, and underscores";
        }
    }
    return true;
}

/**
 * Formats a given article. This simply means that the first letter of every word will become capitalized
 * @param {string} article Article name to format
 * @returns the formatted version of the article name
 */
function formatArticle(article) {
    // follow rules that the beginning of each word should be upper case
    let tokens = article.split(' '); // separate by spaces
    for (let i = 0; i < tokens.length; i++) {
        tokens[i] = tokens[i].charAt(0).toUpperCase() + tokens[i].substring(1);
    }
    let str = "";
    tokens.forEach(toke => {
        str += toke + " ";
    });
    return str.substring(0, str.length - 1);
}

function generateRoomID() {
    const availableLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345789";
    let id = "";
    for (let i = 0; i < 6; i++) {
        id += availableLetters.charAt(Math.floor(Math.random() * availableLetters.length));
    } 
    return id;
}

/**
 * Initializes a Player with some given data
 * @param {string} username Username of the player
 * @param {string} ip IP address of the client
 * @param {string} socketID Specific socket ID of the client
 */
function Player(username, ip, socketID) {
    this.ip = ip;
    this.username = username;
    this.id = socketID;
    this.isHost = false;
    this.isGuesser = false;
    this.currentWord = null;
    this.points = 0;
}

/**
 * Stores the necessary data for a choice
 * @param {string} article Article name
 * @param {string} socketID ID of socket that submitted this article
 */
function Choice(article, socketID) {
    this.article = article;
    this.id = socketID;
}

// define the ROOM class
/**
 * Class to represent a room, which is an instance of a game.
 * Contains information like the rooms ID, password, players, etc. 
 */
function Room() {
    this.players = [];
    this.choices = [];
    this.isInGame = false;
    this.turn = 0;
    this.currentWord = null;
    this.maxPlayers = 8; // set 8 as the default maximum allowed players
    this.id = generateRoomID();
}

/**
 * Chooses a random article from all submitted ones.
 * @returns A random article
 */
Room.prototype.chooseArticle = function() {
    let ind = Math.floor(Math.random() * this.choices.length);
    let choice = this.choices[ind];
    return choice;
}

/**
 * Check if the given username is already taken
 * @param {*} user 
 * @returns 
 */
Room.prototype.usernameExists = function(user) {
    for (let i = 0; i < this.players.length; i++) {
        if (this.players[i].username == user) {
            return true;
        }
    }
    return false;
}

/**
 * Returns the player instance with a given socket ID.
 * @param {string} id Socket ID
 * @returns The player
 */
Room.prototype.getPlayerWithID = function(id) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].id == id) {
            return players[i];
        }
    }
    return null; // didn't find the player 
}

/**
 * Messages all clients in this room updated information about
 * players, choices, connectivity, etc.
 */
Room.prototype.updatePlayerList = function() {
    io.to(this.id).emit("users-update", this);
}

/**
 * Chooses a new word and starts the round for the clients.
 */
Room.prototype.startRound = function() {
    this.currentWord = this.chooseArticle();
    this.isInGame = true;
    io.to(this.id).emit("start-round", this);
}

/**
 * Gets the player with a particular id
 * @param {string} id Socket ID of player to fetch
 */
Room.prototype.getPlayerWithID = function(id) {
    for (let i = 0; i < this.players.length; i++) {
        if (this.players[i].id == id) {
            return this.players[i];
        }
    }
    return null;
}

/**
 * 
 * @param {string} guessID Socket ID of the guess of the guesser
 */
Room.prototype.makeGuess = function(guessID) {
    let guesser = this.players[this.turn];
    // check if the guess was correct
    if (guessID == this.currentWord.id) {
        // add points 
        guesser.points += 1; // to the guesser for guessing correctly
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id == this.currentWord.id) {
                this.players[i].points += 1; // that player also gets a point for describing the topic so believably.
            }
        }
    }
    else { // the guess was incorrect
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id == guessID) {
                this.players[i].points += 2; // if they tricked the guesser, they get 2 points
                break;
            }
        }
    }

    // remove that chosen word
    for (let i = 0; i < this.choices.length; i++) {
        if (this.choices[i].id == this.currentWord.id) {
            this.choices.splice(i, 1);
            break;
        }
    }

    // end the game here
    // first rotate the turn
    this.turn = (this.turn + 1) % this.players.length;
    // remove the new guesser word from rotation
    let p = this.players[this.turn].id;
    for (let i = 0; i < this.choices.length; i++) {
        if (this.choices[i].id == p) {
            this.choices.splice(i, 1);
            break;
        }
    }

    // no longer in game
    this.isInGame = false;
    // let the players know what happened
    io.to(this.id).emit('round-results', {chooser: guesser.username, guessed: this.getPlayerWithID(guessID).username, correct: this.getPlayerWithID(this.currentWord.id).username});
    this.updatePlayerList();
}

/**
 * Store all created rooms in a map that associates room ID to the room.
 */
let rooms = new Map();

io.on('connection', socket => {
    console.log(socket.id + " connected");

    // fetch this socket's IP
    let address = socket.handshake.address;
    console.log('new connection from ' + address);
    // check if this client's IP has already joined a room
    // if they have, simply display that room
    // TODO: 

    io.to(socket.id).emit('connection', socket.id);

    /**
     * Request to create a room
     */
    socket.on("create-room", () => {
        let room = new Room();
        rooms.set(room.id, room);
        io.to(socket.id).emit("created-room", room.id);
    });

    let thisRoom = null;

    /**
     * Ensures that the given data is valid for joining a room
     * i.e. correct room ID and a valid username
     */
    socket.on("join-room", data => {
        let username = data.username;
        let joinID = data.joinID;
        // find the room of that ID
        let room = rooms.get(joinID);
        if (room == undefined) {
            io.to(socket.id).emit('join-error', 'Invalid room code!');
        }
        else {
            if (room.isInGame) {
                io.to(socket.id).emit('join-error', "There\'s already an active game! Try again later");
            }
            else if (room.usernameExists(username)) {
                io.to(socket.id).emit('join-error', 'That name is already taken!');
            }
            else {
                let valid = usernameIsValid(username);
                if (valid == true) {
                    // then make a player and add it to the room.
                    let player = new Player(username, address, socket.id);
                    thisRoom = room;
                    socket.join(room.id);
                    room.players.push(player);
                    room.updatePlayerList();
                }
                else {
                    io.to(socket.id).emit('join-error', valid);
                }
            }
        }
    });

    socket.on('submit-article', article => {
        // double check that this socket has not submitted an article already
        for (let i = 0; i < thisRoom.choices.length; i++) {
            if (thisRoom.choices[i].id == socket.id) {
                return; // already submitted one!
            }
        }
        article = formatArticle(article);
        // add that article to the list of choices
        thisRoom.choices.push(new Choice(article, socket.id));
        thisRoom.updatePlayerList();
    });

    socket.on("start-round", () => {
        // first thing to do is choose a badinga
        thisRoom.startRound();
        // then start the damn badinga!
    });

    socket.on("guess-user", (id) => {
        thisRoom.makeGuess(id);
        return;
        // check if the guess was correct
        if (id == thisRoom.currentWord.id) {
            // add points or whatever
            for (let i = 0; i < thisRoom.players.length; i++) {
                if (thisRoom.players[i].id == socket.id) {
                    thisRoom.players[i].points += 1; // if they guessed the right player, they get 1 point
                }
                else if (thisRoom.players[i].id == thisRoom.currentWord.id) {
                    players[i].points += 1; // that player also gets a point for describing the topic so believably.
                }
            }
        }
        else {
            for (let i = 0; i < players.length; i++) {
                if (players[i].id == id) {
                    players[i].points += 2; // if they tricked the guesser, they get 2 points
                    break;
                }
            }
        }

        // remove that chosen word
        for (let i = 0; i < choices.length; i++) {
            if (choices[i].id == currentWord.id) {
                choices.splice(i, 1);
                break;
            }
        }

        // end the game here
        guesserIndex = (guesserIndex + 1) % players.length;
        // remove the new guessers word from rotation
        let p = players[guesserIndex].id;
        for (let i = 0; i < choices.length; i++) {
            if (choices[i].id == p) {
                choices.splice(i, 1);
                break;
            }
        }

        inGame = false;
        io.to(lobby).emit('round-results', {chooser: getPlayerWithID(socket.id).username, guessed: getPlayerWithID(id).username, correct: getPlayerWithID(currentWord.id).username});
        playersToRemove.forEach(id => {
            // find if there is a choice with that ID and remove it.
            for (let i = 0; i < choices.length; i++) {
                if (choices[i].id == id) {
                    choices.splice(i, 1);
                    break;
                }
            }
            for (let i = 0; i < players.length; i++) {
                if (players[i].id == id) {
                    players.splice(i, 1);
                    break;
                }
            }
        });
        playersToRemove = [];

        if (players.length == 0) guesserIndex = 0;
        else guesserIndex %= players.length; // bleep bloop, fix the guesser.
        if (players.length > 0) { // only need to check this if anyone is left
            // determine now if the player who became the guesser (if that was the case), has already made a choice
            let guesserID = players[guesserIndex].id;
            for (let i = 0; i < choices.length; i++) {
                if (choices[i].id == guesserID) {
                    choices.splice(i, 1); // unfortunate
                    break;
                }
            }
        }
        io.to(lobby).emit("users-update", {players: players, guesserIndex: guesserIndex, choices: choices});
    });

    socket.on('disconnect', () => {
        return;
        console.log(socket.id + " disconnected");
        let playerInGame = false;
        // find the player with that ID and remove them
        for (let i = 0; i < players.length; i++) {
            if (players[i].id == socket.id) {
                playerInGame = true;
                break;
            }
        }
        if (!inGame) {
            for (let i = 0; i < players.length; i++) {
                if (players[i].id == socket.id) {
                    players.splice(i, 1);
                    break;
                }
            }
            io.to(lobby).emit("users-update", {players: players, guesserIndex: guesserIndex, choices: choices});
        }
        if (playerInGame) {
            playersToRemove.push(socket.id);
        }
    });
});


// if an environment PORT is set, use that, otherwise use port 80 (default port for web traffic)
let port = process.env.PORT || 80;
server.listen(process.env.PORT || 80, () => {
    console.log("listening on *:" + port);
})