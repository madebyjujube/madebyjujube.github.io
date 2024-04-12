// ======================================================
// ======================= DRAW =========================
// ======================= P5JS =========================
// ======================================================

function setup() {
    
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const uiH = style.getPropertyValue('--ui-el-h').slice(0, -2);

    cx = width / 2;
    cy = height / 2;

    let canvas = createCanvas(95, uiH);
    canvas.parent('p5js');

    background(0);
}

function draw() {
    // if (initialized) {
        background('black');
        stroke('white');
        noFill();
        let buffer = waveform.getValue(0);
        beginShape();
        for (let i = 0; i < buffer.length; i++) {
            let x = map(i, 0, buffer.length, 0, width);
            let y = map(buffer[i], -0.5, 0.5, 0, height);
            vertex(x, y);
        }
        endShape();
    // }
}