import { io } from "socket.io-client";
import {
  addNewNodeToDatabase,
  populateGraph,
  updateDatabase,
} from "./forcegraph.js";
import { graph, database } from "./main.js";

let socket = null;
let currentUsername = null;

export function initSocket(username = null) {
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
    console.log("Connected to server");
    
    // If we have a username, join that database
    if (currentUsername) {
      socket.emit("join-database", currentUsername);
    }
  });

  socket.on("database", (newDatabase) => {
    console.log("Received database:", newDatabase);
    updateDatabase(database, newDatabase);
    populateGraph(graph, database);
  });

  socket.on("new-node", (node) => {
    addNewNodeToDatabase(database, node);
    populateGraph(graph, database);
  });

  socket.on("error", (errorMsg) => {
    console.error("Server error:", errorMsg);
  });

  return socket;
}

// Helper to re-initialize with username after login
export function joinDatabase(username) {
  if (!socket) return;
  
  currentUsername = username;
  socket.emit("join-database", username);
}

// Helper to upload audio with username context
export function uploadAudioWithUsername(buffer, name, username) {
  if (!socket) return;
  
  socket.emit("upload_audio", { buffer, name, username });
  socket.emit("uploaded-node", { nodeName: name, username });
}

export function getSocket() {
  return socket;
}

export function getCurrentUsername() {
  return currentUsername;
}