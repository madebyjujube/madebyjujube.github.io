const express = require("express");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const { Server } = require("socket.io");
const { createServer } = require("node:http");

// MY-MODULES
const { writeDb, readDb, updateJSONFile } = require("./dbScripts/dbFunction.js");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Track active user sessions: socket.id -> username
const userSessions = new Map();

/**
 * Helper: Get database path for a username
 */
function getUserDbPath(username) {
  return `./datasets/${username}.json`;
}

/**
 * Helper: Get audio directory for a username
 */
function getUserAudioPath(username) {
  return `./audio/${username}`;
}

/**
 * Helper: Ensure user directories exist
 */
async function ensureUserExists(username) {
  const audioPath = getUserAudioPath(username);
  const dbPath = getUserDbPath(username);
  
  try {
    // Create audio directory
    await fs.mkdir(audioPath, { recursive: true });
    
    // Create empty database if it doesn't exist
    try {
      await fs.access(dbPath);
    } catch {
      // File doesn't exist, create empty database
      const emptyDb = { nodes: [], links: [] };
      await fs.writeFile(dbPath, JSON.stringify(emptyDb, null, 2));
    }
  } catch (err) {
    console.error(`Error creating user ${username}:`, err);
  }
}

// ===============
// MIDDLEWARE:
// ===============
app.use(express.static("dist"));
app.use(express.static("src/assets"));
app.use('/audio', express.static('audio'));
app.use('/src/assets/images', express.static('/src/assets/images'));
app.use(express.json());

// ===============
// MULTER: DYNAMIC STORAGE BASED ON USERNAME
// ===============
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Get username from query param or body
    const username = req.query.username || req.body.username || 'default';
    const userPath = getUserAudioPath(username);
    
    try {
      await fs.mkdir(userPath, { recursive: true });
      cb(null, userPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// ==============
// HTTP ROUTES:
// ==============

// Get database for specific user
app.get("/database/:username", async (req, res) => {
  const username = req.params.username;
  await ensureUserExists(username);
  const dbPath = getUserDbPath(username);
  const data = readDb(dbPath);
  res.send(data);
});

// Legacy route (for backward compatibility)
app.get("/database", (req, res) => {
  const data = readDb("./datasets/testdb.json");
  res.send(data);
});

// Write node data for specific user
app.post("/node-data/:username", async (req, res) => {
  const username = req.params.username;
  await ensureUserExists(username);
  const dbPath = getUserDbPath(username);
  updateJSONFile(req.body, dbPath);
  res.send("server received and wrote data to JSON file");
});

// Legacy route
app.post("/node-data", (req, res) => {
  updateJSONFile(req.body, "./datasets/testdb.json");
  res.send("server received and wrote data to JSON file");
});

// Upload audio for specific user
app.post("/upload/:username", upload.single("audio"), async (req, res) => {
  const username = req.params.username;
  const dbPath = getUserDbPath(username);
  
  // Add to user's database
  writeDb({ label: req.file.originalname }, dbPath);
  res.send("audio uploaded");
});

// Legacy upload route
app.post("/upload", upload.single("audio"), (req, res) => {
  writeDb({ label: req.file.originalname }, "./datasets/testdb.json");
  res.send("audio uploaded");
});

// ================
// SOCKET.IO EVENTS:
// ================
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  
  let currentUsername = null;

  // NEW: User joins with username
  socket.on("join-database", async (username) => {
    if (!username || username.trim() === "") {
      socket.emit("error", "Invalid username");
      return;
    }
    
    currentUsername = username.trim();
    userSessions.set(socket.id, currentUsername);
    
    console.log(`User ${socket.id} joined as "${currentUsername}"`);
    
    // Ensure user exists and get their database
    await ensureUserExists(currentUsername);
    const dbPath = getUserDbPath(currentUsername);
    const userDb = readDb(dbPath);
    
    // Send only to this socket
    socket.emit("database", userDb);
    
    // Join a room for this username (for future broadcast features)
    socket.join(currentUsername);
  });

  // Legacy: Broadcast database request (for old clients)
  socket.on("database-req", () => {
    const username = userSessions.get(socket.id);
    const dbPath = username ? getUserDbPath(username) : "./datasets/testdb.json";
    const database = readDb(dbPath);
    socket.emit("database", database);
  });

  // NEW: Handle uploaded node with username context
  socket.on("uploaded-node", (data) => {
    // Data can be just a string (legacy) or an object { nodeName, username }
    const nodeName = typeof data === 'string' ? data : data.nodeName;
    const username = typeof data === 'string' ? userSessions.get(socket.id) : data.username;
    
    if (!username) {
      socket.emit("error", "Not authenticated. Please login first.");
      return;
    }
    
    const dbPath = getUserDbPath(username);
    let database = readDb(dbPath);

    const target = findTargetId(database);
    const value = findValue();
    const nodeObj = {
      id: nodeName,
      source: nodeName,
      target,
      value,
    };

    writeDb(nodeObj, dbPath);
    
    // Emit only to users with the same username (same room)
    io.to(username).emit("new-node", nodeObj);
  });

  // Handle audio upload via socket
  socket.on("upload_audio", async (data) => {
    const username = userSessions.get(socket.id) || 'default';
    const userAudioPath = getUserAudioPath(username);
    
    await fs.mkdir(userAudioPath, { recursive: true });
    await fs.writeFile(path.join(userAudioPath, `${data.name}.wav`), data.buffer);
    
    // Notify other clients with same username
    io.to(username).emit("audio-uploaded", { name: data.name, username });
  });

  // CHAT-APP (optional: make it username-specific)
  socket.on("chat message", (msg) => {
    const username = userSessions.get(socket.id);
    // Broadcast to all or just same username room
    io.emit("chat message", { ...msg, username });
  });

  // DISCONNECTED
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    userSessions.delete(socket.id);
  });
});

// Helper functions
function findTargetId(database) {
  if (!database.nodes || database.nodes.length < 2) return null;
  let maxAvailableIndices = database.nodes.length - 2;
  let newTargetIndex = Math.round(Math.random() * maxAvailableIndices);
  return database.nodes[newTargetIndex].id;
}

function findValue() {
  return Math.random() * 10;
}

// START SERVER
const PORT = process.env.PORT || 5555;
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});