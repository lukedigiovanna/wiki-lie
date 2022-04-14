/**
 * This script is responsible for adding several of the animations that make 
 * Wiki-Lie a beautiful thing.
 */

/**
 * Sets the height of the wiki content to its full content height.
 */
function setWikiHeight() {
    var element = document.getElementById("wiki-content");
    element.style.height = element.scrollHeight + "px";
}

let down = true;
function toggleWikiCollapse() {
    down = !down;
    
    let arrowElement = document.getElementById('drop-down-arrow');
    arrowElement.innerText = down ? "▼" : "▲";
    
    let element = document.getElementById('wiki-content');
    if (!down) { // if the element is visible
        element.style.height = 0; // make it not visible
    } else {
        element.style.height = element.scrollHeight + "px"; // make it visible
    }
}

function forceOpenWikipedia() {
    var element = document.getElementById("wiki-content");
    // ensure we always get the height of the CONTENT
    let scrollHeight = document.getElementsByClassName('mw-parser-output')[0].scrollHeight + 20; // add 20 to ensure whole article is visible.
    element.style.height = scrollHeight + "px";
    $('.drop-down-line span').text('▼')
    down = true;
}


// NOT MY CODE
// Copies a string to the clipboard. Must be called from within an
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+,
// Firefox 42+, Safari 10+, Edge and Internet Explorer 10+.
// Internet Explorer: The clipboard feature may be disabled by
// an administrator. By default a prompt is shown the first
// time the clipboard is used (per session).
function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return window.clipboardData.setData("Text", text);

    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        }
        catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return prompt("Copy to clipboard: Ctrl+C, Enter", text);
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
}

let sidebarShown = true;

/**
 * @pre The client is on the game page
 */
function toggleOptionsSidebar() {
    sidebarShown = !sidebarShown;

    const sidebarElement = document.getElementById("options-sidebar");
    if (sidebarShown) {
        sidebarElement.style.width = "400px";
    }
    else {
        sidebarElement.style.width = 0;
    }
}