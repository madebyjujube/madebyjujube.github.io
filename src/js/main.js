import { Audio } from "./audio.js";
import { initUi } from "./ui.js";
import { initSocket } from "./socket.js";
import { initWaveform } from "./waveform.js";
// import { graphInit } from "./forcegraph.js";

export const audio = new Audio();

export const socket = initSocket();

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

main();

function main() {
  console.log("main.js");
  initUi();
  initWaveform();
  // graphInit();
}