
/**
 * Displays the username entry and a button which will 
 * direct the server to create and join a room for that 
 * client.
 */
function createRoomButtons() {
    $("#start-buttons").load("createroom.html");
}

/**
 * Displays the username entry and a button which will
 * direct the server to join a room with a specified ID.
 */
function joinRoomButtons() {
    $("#start-buttons").load("joinroom.html");
}