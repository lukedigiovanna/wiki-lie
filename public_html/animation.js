/**
 * This script is responsible for adding several of the animations that make 
 * Wiki-Lie a beautiful thing.
 */

/**
 * @pre The element has its overflow property set to "hidden" and any animation is attached to it already.
 * @param {string} id ID of element to toggle visibility of
 */
function toggleCollapse(id) {
    var element = document.getElementById(id);

    if (element.clientHeight) { // if the element is visible
        element.style.height = 0; // make it not visible
    } else {
        element.style.height = element.scrollHeight + "px"; // make it visible
    }
}

let down = true;
function toggleDropArrow(t) {
    down = !down; 
    t.innerText = down ? "▼" : "▲";
}

function forceOpenWikipedia() {
    var element = document.getElementById("wiki-content");
    if (!element.clientHeight) {
        element.style.height = element.scrollHeight + "px";
        $('.drop-down-line span').text('▼')
        down = true;
    }
}