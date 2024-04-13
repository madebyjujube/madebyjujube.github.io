// ======================================================
// ======================= DRAW =========================
// ======================= P5JS =========================
// ======================================================
import p5 from "p5";
import { audio } from "./main.js";

const sketch = (p5) => {
  p5.setup = () => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const uiH = style.getPropertyValue("--ui-el-h").slice(0, -2);

    // cx = p5.width / 2;
    // cy = p5.height / 2;

    let canvas = p5.createCanvas(95, uiH);
    canvas.parent("p5js");

    p5.background(0);
  };

  p5.draw = () => {
    // if (initialized) {
    p5.background("black");
    p5.stroke("white");
    p5.noFill();
    let buffer = audio.waveform.getValue(0);
    p5.beginShape();
    for (let i = 0; i < buffer.length; i++) {
      let x = p5.map(i, 0, buffer.length, 0, p5.width);
      let y = p5.map(buffer[i], -0.5, 0.5, 0, p5.height);
      p5.vertex(x, y);
    }
    p5.endShape();
    // }
  };
};

export function initWaveform() {
  const P5 = new p5(sketch);
}

