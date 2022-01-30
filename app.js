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

let players = []; // store each player as a JSON object with their socket id and username
let choices = []; // store each choice as a JSON object with the choice and the originating player's socket id

let guesserIndex = 0;

let inGame = false;
let currentWord = null; 

let lobby = "lobby";

function usernameExists(user) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].username == user) {
            return true;
        }
    }
    return false;
}

function usernameIsValid(user) {
    if (user.length < 1 || user.length > 20) {
        return "notsize";
    }
    // a username is valid if it is between 1 and 20 characters and is composed of the following letters
    const validLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    for (let i = 0; i < user.length; i++) {
        if (!validLetters.includes(user.charAt(i))) {
            return "badletter";
        }
    }
    return true;
}

function getPlayerWithID(id) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].id == id) {
            return players[i];
        }
    }
    return null;
}

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

function chooseArticle() {
    let ind = Math.floor(Math.random() * choices.length);
    let choice = choices[ind];
    return choice;
}

let playersToRemove = [];

io.on('connection', socket => {
    console.log(socket.id + " connected");
    io.to(socket.id).emit('connection', socket.id);


    socket.on('submit-user', user => {
        if (inGame) {
            io.to(socket.id).emit('invalid-user', 'There\'s already an active game!<br>Try again later');
            return;
        }
        console.log(user + " joined the game");
        // check if that user exists
        if (usernameExists(user)) {
            io.to(socket.id).emit('invalid-user', 'That name already is being used');
        }
        else {
            let valid = usernameIsValid(user);
            if (valid == true) {
                players.push({username: user, id: socket.id, points: 0});
                socket.join(lobby);
                io.to(lobby).emit('users-update', {players: players, guesserIndex: guesserIndex, choices: choices});
            }
            else if (valid == "notsize") {
                io.to(socket.id).emit("invalid-user", "Your username must be between 1 and 20 characters");
            }
            else {
                io.to(socket.id).emit('invalid-user', "Your username can only contain letters, numbers, and underscores");
            }
        }
    });

    socket.on('submit-article', article => {
        // double check that this socket has not submitted an article already
        for (let i = 0; i < choices.length; i++) {
            if (choices[i].id == socket.id) {
                return; // already submitted one!
            }
        }
        article = formatArticle(article);
        // add that article to the list of choices
        choices.push({article: article, id: socket.id});
        io.to(lobby).emit('users-update', {players: players, guesserIndex: guesserIndex, choices: choices});
    });

    socket.on("start-round", () => {
        // first thing to do is choose a badinga
        currentWord = chooseArticle();
        inGame = true;
        io.to(lobby).emit("start-round", {word: currentWord, players: players, turn: guesserIndex});
    });

    socket.on("guess-user", (id) => {
        // check if the guess was correct
        if (id == currentWord.id) {
            // add points or whatever
            for (let i = 0; i < players.length; i++) {
                if (players[i].id == socket.id) {
                    players[i].points += 1; // if they guessed the right player, they get 1 point
                }
                else if (players[i].id == currentWord.id) {
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

server.listen(3000, () => {
    console.log("listening on *:3000")
})