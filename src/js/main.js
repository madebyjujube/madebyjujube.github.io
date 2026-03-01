import { configFont } from "./adobefonts.js";
import { initSocket } from "./socket.js";
import { initUi } from "./ui.js";
import { initWaveform } from "./waveform.js";
import { initGraph, initDatabase } from "./forcegraph.js";
import { Audio } from "./audio.js";

// DOM Elements
export const instructions = document.getElementById("instructions");
export const inputID = document.getElementById("username");
export const editBtn = document.getElementById("editbtn");
export const uploadBtn = document.getElementById("uploadBtn");
export const loginBtn = document.getElementById("loginbtn");
export const nodeNameElement = document.getElementById("nodename");
export const recBtn = document.getElementById("recbtn");
export const cueBtn = document.getElementById("cuebtn");

// Global state
export const audio = new Audio();
export let socket = null;  // Initialized in main()
export let database = initDatabase();
export const graph = initGraph(database);
export let userData = {
  username: "home",  // Default to home
};

main();

function main() {
  console.log("hello, fellow dev");
  configFont(document);
  
  // Initialize socket as "home" immediately
  socket = initSocket("home", graph, database);
  
  initUi();
  initWaveform();
}