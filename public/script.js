(function () {
    const canvas = document.getElementById("canvas-signature");
    const ctx = canvas.getContext("2d");
    //styles
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    //Eventlisteners
    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);

    //functions for event listeners
    function mouseDown(e) {
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
        canvas.addEventListener("mousemove", draw, false);
    }
    function mouseUp(e) {
        canvas.removeEventListener("mousemove", draw);
        draw(e);
    }
    function draw(e) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }

    //sending data to hidden field
    const submitButton = document.getElementById("submit-button");
    const signatureData = document.getElementById("hidden-data");
    submitButton.addEventListener("click", click, false);

    function click() {
        let dataUrl = canvas.toDataURL();
        signatureData.innerHTML = dataUrl;
    }
})();
