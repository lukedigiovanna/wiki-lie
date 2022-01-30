
let socket = io();
let ourID;

socket.on('connection', (id) => {
    ourID = id; // useful for checking when it's our turn for an action or other user specific UI elements
    $("#main").load("signin.html");
})

function join() {
    // read the inputted username
    let user = $("#username-input").val();
    socket.emit("submit-user", user);
}

socket.on('invalid-user', reason => {
    $("#invalid-user").text(reason);  
});

socket.on('start-round', (data) => {
    let word = data.word;
    let players = data.players;
    let turn = data.turn;
    restartTimer();
    // we just need to update that input area
    $("#input").load("round.html", () => {
        $("#everyone-word").text(word.article);
        console.log(word.article);
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
    $("#wikipedia").css("display", "none");
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

socket.on('users-update', data => {
    let turn = data.guesserIndex;
    let players = data.players;
    let choices = data.choices;

    $("#main").load("players.html", () => {
        if (players.length < 3) {
            $("#player-count").text(players.length + "/3");
            $("#player-count").css("color", "red");
        }
        else {
            $("#player-count").text(players.length);
            $("#player-count").css("color", "green");
        }
    
        $("#ready-count").text(choices.length + "/" + (players.length - 1));
        if (players.length >= 3 && choices.length == players.length - 1) {
            $("#ready-count").css("color", "green");
        }
        else {
            $("#ready-count").css("color", "red");
        }
    
        $('#player-list').html("");
        for (let i = 0; i < players.length; i++) {
            let user = players[i];
            let item = document.createElement("li");
            item.innerText = user.username;
            if (user.id == ourID) {
                item.style.fontWeight = "bold";
                item.innerText += ' [you]'
            }
            if (i == turn) {
                item.style.color = "gold";
                item.innerText += ' [guesser]';
                if (user.id != ourID) {
                    weAreGuesser = false;
                }
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
    
        $("#wikipedia").css("display", "inline");
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

let isMobile = false;
let revealed = false;
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
