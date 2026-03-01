import { io } from "socket.io-client";

let socket = null;
let currentUsername = null;
let globalGraph = null;
let globalDatabase = null;

export function initSocket(username = "home", graph, database) {
  globalGraph = graph;
  globalDatabase = database;
  
  // RAILWAY FIX: Better URL detection
  const isLocalhost = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1";
  
  let socketUrl;
  if (isLocalhost) {
    // Local development - connect to Express on 5555
    socketUrl = `${window.location.protocol}//${window.location.hostname}:5555`;
  } else {
    // Production - same origin (Railway handles routing)
    socketUrl = window.location.origin;
  }
  
  console.log("Connecting to socket at:", socketUrl);
  
  socket = io(socketUrl, {
    transports: ['websocket', 'polling'], // Fallback for compatibility
    timeout: 10000
  });
  
  currentUsername = username;

  socket.on("connect", () => {
    console.log("Connected to server, joining as:", currentUsername);
    socket.emit("join-database", currentUsername);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("database", (newDatabase) => {
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

// Import these or define them if needed
function updateDatabase(db, newDb) {
  db.nodes = newDb.nodes;
  db.links = newDb.links;
}

function populateGraph(graph, db) {
  if (graph && graph.graphData) {
    graph.graphData(db);
  }
}

function addNewNodeToDatabase(db, node) {
  db.nodes.push({ id: node.id });
  db.links.push({
    source: node.source,
    target: node.target,
  });
}