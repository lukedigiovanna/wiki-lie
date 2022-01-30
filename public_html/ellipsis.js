
let idx = 0;
setInterval(() => {
    let s = "";
    for (let i = 0; i < idx; i++) {
        s += ".";
    }
    idx = (idx + 1) % 4;
    $(document).find(".ellipsis").text(s);
}, 400);