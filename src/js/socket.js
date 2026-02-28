import { io } from "socket.io-client";
import {
  addNewNodeToDatabase,
  populateGraph,
  updateDatabase,
} from "./forcegraph.js";

let socket = null;
let currentUsername = null;
let globalGraph = null;
let globalDatabase = null;

export function initSocket(username = "home", graph, database) {
  // Store references
  globalGraph = graph;
  globalDatabase = database;
  
  const EXPRESS_PORT = 5555;
  const ROOT_URL =
    window.location.hostname === "localhost"
      ? window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        EXPRESS_PORT
      : window.location.origin;
  
  socket = io(ROOT_URL);
  currentUsername = username;

  socket.on("connect", () => {
    console.log("Connected to server, joining as:", currentUsername);
    socket.emit("join-database", currentUsername);
  });

  socket.on("database", (newDatabase) => {
    // console.log("Received database for", currentUsername, ":", newDatabase);
    updateDatabase(globalDatabase, newDatabase);
    populateGraph(globalGraph, globalDatabase);
  });

  socket.on("new-node", (node) => {
    addNewNodeToDatabase(globalDatabase, node);
    populateGraph(globalGraph, globalDatabase);
  });

  socket.on("error", (errorMsg) => {
    console.error("Server error:", errorMsg);
  });

  return socket;
}

export function joinDatabase(username) {
  if (!socket) return;
  currentUsername = username;
  socket.emit("join-database", username);
}

export function getSocket() {
  return socket;
}

export function getCurrentUsername() {
  return currentUsername;
}