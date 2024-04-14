import { configFont } from "./adobefonts.js"
import { Audio } from "./audio.js";
import { initSocket } from "./socket.js";
import { initUi } from "./ui.js";
import { initWaveform } from "./waveform.js";
import { initGraph } from "./forcegraph.js";


/**
 * HTMLElement that plays back recordings.
*/
export const audioPlayerElement = document.querySelector("#buffer");
export const inputID = document.getElementById("username");
export const editBtn = document.getElementById("editbtn");
export const uploadBtn = document.getElementById("uploadBtn");
export const loginBtn = document.getElementById("loginbtn");
export const nodeName = document.getElementById("nodename");
export const recBtn = document.getElementById("recbtn");
export const cueBtn = document.getElementById("cuebtn");

export const audio = new Audio();
export const socket = initSocket();

main();

function main() {
  console.log("main.js");
  configFont(document)
  initUi();
  initWaveform();
  initGraph();
  
}
