
let socket = io();
let ourID;

/**
 * Signals entry tasks
 */
socket.on('connection', (id) => {
    ourID = id; // useful for checking when it's our turn for an action or other user specific UI elements
    $("#main").load("signin.html"); // load in the sign in page
})

/**
 * Attempts to join the room given the inputted ID
 * and username
 */
function joinRoom() {
    let roomID = $("#room-id-input").val().toUpperCase();
    join(roomID);
}

/**
 * Sends a request to the server to create a room and 
 * the server will then send back a message to the user when
 * it is ready to join. (happens instantly)
 */
function createRoom() {
    socket.emit("create-room");
}
socket.on("created-room", (id) => {
    join(id);
});

/**
 * Attempts to join a given room.
 * @param {string} roomID Join code for the room
 */
function join(roomID) {
    // read the inputted username
    let user = document.getElementById("username-input").value;
    // message the server for the client to join
    socket.emit("join-room", {username: user, joinID: roomID});
}

/**
 * Displays an error for not being able to join a room
 */
socket.on('join-error', reason => {
    $("#join-error").text(reason);  
});

socket.on('start-round', (room) => {
    let word = room.currentWord;
    let players = room.players;
    let turn = room.turn;
    restartTimer();
    // we just need to update that input area
    $("#input").load("round.html", () => {
        $("#everyone-word").text(word.article);
        // check if we are the guesser
        if (weAreGuesser) {
            // list out buttons to choose each other player
            for (let i = 0; i < players.length; i++) {
                if (i != turn) {
                    let button = document.createElement("button");
                    button.innerText = players[i].username;
                    button.onclick = () => {
                        socket.emit("guess-user", players[i].id);
                    };
                    button.style.margin = "1em";
                    $("#input").append(button);
                }
            }
        }
    });
    // make the wikipedia section go away
    $("#wiki-section").css("display", "none");
});

socket.on("round-results", results => {
    $("#results").load("results.html", () => {
        // set the values
        let str = "incorrectly"
        if (results.guessed == results.correct) {
            str = "correctly";
        }
        $("#results-text").html("<b>" + results.chooser + "</b> "+ str +" guessed <b>" + results.guessed + "<b>")
        $("#truthteller").text(results.correct);
    });
    setTimeout(() => {
        $("#results").html(""); // clear the results section after some time.
    }, 15000);
});

/**
 * TIMER STUFF:
 */
let last;
/**
 * Get's the time of the computer
 * @returns Time in seconds since jan 1 1970
 */
function time() {
    return (new Date()).getTime() / 1000;
}
function restartTimer() {
    last = time()
}
function formatNum(num) {
    if (num < 10) return "0" + num;
    else return num;
}
setInterval(() => {
    let elapsed = Math.floor(time() - last); // stored in seconds
    let minutes = formatNum(Math.floor(elapsed / 60))
    let seconds = formatNum(elapsed % 60);

    $("#timer").text(minutes + ":" + seconds);
}, 50);

// 
// END TIMER STUFF

function kick(id) {
    socket.emit("kick-player", id);
}

socket.on('users-update', room => {
    let turn = room.turn;
    let players = room.players;
    let choices = room.choices;

    $("#main").load("players.html", () => {
        // HEADER STUFF
        if (players.length < 3) {
            $("#player-count").text(players.length + "/3");
            $("#player-count").css("color", "red");
        }
        else {
            $("#player-count").text(players.length);
            $("#player-count").css("color", "green");
        }
        $("#join-code").text(room.id);
        $("#ready-count").text(choices.length + "/" + (players.length - 1));
        if (players.length >= 3 && choices.length == players.length - 1) {
            $("#ready-count").css("color", "green");
        }
        else {
            $("#ready-count").css("color", "red");
        }
    
        // THE PLAYER LIST
        let us;
        for (let i = 0; i < players.length; i++) {
            if (players[i].id == ourID) {
                us = players[i];
                break;
            }
        }
        $('#player-list').html("");
        for (let i = 0; i < players.length; i++) {
            let user = players[i];
            let item = document.createElement("li");
            item.innerText = user.username;
            // if we are also the host, add the kick button
            if (i == turn) {
                item.style.color = "gold";
                item.innerText += ' [guesser]';
                if (user.id != ourID) {
                    weAreGuesser = false;
                }
            }
            if (!user.connected && us.isHost) {
                item.innerHTML += " [<span class=\'kick-button\' onclick=\'kick(\""+user.id+"\")\'>kick</span>]";
            }
            if (user.id == ourID) {
                item.style.fontWeight = "bold";
                item.innerText += ' [you]'
            }
            let chose = false;
            choices.forEach(choice => {
                if (choice.id == user.id) {
                    item.innerHTML += " [<span style='color: green'>✓</span>]"
                    chose = true;
                    return;
                }
            });
            if (!chose && i != turn) {
                item.innerHTML += " [choosing<span class='ellipsis'></span>]"
            }
            item.innerHTML += " [" + user.points + " pts]";
            if (!user.connected) {
                item.innerHTML += " [<span style='color: red'>disconnected</span>]"
            }
            if (user.isHost) {
                item.innerHTML += " ⭐";
            }


            $("#player-list").append(item);
        }
    
        let guesserID = players[turn].id;
        if (guesserID != ourID) {
            // make sure we haven't already guessed
            let alreadyChose = false;
            let chosenArticle;
            for (let i = 0; i < choices.length; i++) {
                if (choices[i].id == ourID) {
                    alreadyChose = true;
                    chosenArticle = choices[i].article;
                    break;
                }
            }
            if (!alreadyChose) {
                submittedWord = false;
                $("#input").load("inputarticle.html");
                document.getElementById("input").addEventListener("keydown", (e) => {
                    if (e.key == "Enter") {
                        submitArticle();
                    }
                });
            }
            else {
                $("#input").load("yourword.html", () => {
                    $("#word").text(chosenArticle);
                });
            }
        }
        else {
            // we are the guesser
            $("#input").load("guesserwait.html", () => {
                console.log("loading start button");
                if (players.length >= 3 && choices.length >= players.length - 1) {
                    document.getElementById("start-button").disabled = false;
                    console.log($("#start-button").text());
                }
            });
        }
        
        // only reveal, if not in game
        if (!room.isInGame) {
            $("#wiki-section").css("display", "inline");
        }
    });
});

let submittedWord = false;

function submitArticle() {
    if (!submittedWord) {
        console.log("attempting to submit");
        // fetch the given article name
        let articleName = $("#submission").val();
        if (articleName.length == 0) {
            alert("Enter something!");
        }
        else {
            // let the server know we are submitting an article.
            socket.emit("submit-article", articleName);
            submittedWord = true;

            // then we need to replace the display area thing
            $("#input").load("yourword.html", () => {
                $("#word").text(articleName);
            });
        }
    }
}

let weAreGuesser = false;
function startRound() {
    // send a message to the server to begin the round.
    // the server will relay information back to all clients that the round has started and to update UI
    socket.emit("start-round");
    weAreGuesser = true;
}

window.onresize = () => {
    $("#wikipedia").css("height", window.innerHeight + "px");
}
window.onload = () => {
    $("#wikipedia").css("height", window.innerHeight + "px");
}

let revealed = false;
let isMobile = false;
function toggleReveal() {
    if (isMobile) {
        revealed = !revealed;
        if (revealed) {
            $("#word").css("background-color", "white");
        }
        else {
            $("#word").css("background-color", "black");
        }
    }
}
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    isMobile = true;
}
