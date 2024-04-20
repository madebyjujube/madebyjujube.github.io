import { configFont } from "./adobefonts.js";
import { initSocket } from "./socket.js";
import { initUi } from "./ui.js";
import { initWaveform } from "./waveform.js";
import { initGraph, initDatabase, resizeGraph } from "./forcegraph.js";
import { Audio } from "./audio.js";
/**
 * HTMLElement that plays back recordings.
 */
//
export const instructions = document.getElementById("instructions");
export const inputID = document.getElementById("username");
export const editBtn = document.getElementById("editbtn");
export const uploadBtn = document.getElementById("uploadBtn");
export const loginBtn = document.getElementById("loginbtn");
export const nodeNameElement = document.getElementById("nodename");
export const recBtn = document.getElementById("recbtn");
export const cueBtn = document.getElementById("cuebtn");
//

export const audio = new Audio();
export const socket = initSocket();
export let database = initDatabase();
export const graph = initGraph(database);

main();

function main() {
  console.log("hello, fellow dev");
  configFont(document);
  initUi();
  initWaveform();
  
  // ready for db
  socket.emit("database-req");
}
