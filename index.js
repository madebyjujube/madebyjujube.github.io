// DEBUG
const fs = require('fs');
console.log('Current directory:', __dirname);
console.log('dist exists:', fs.existsSync('./dist'));
console.log('dist contents:', fs.existsSync('./dist') ? fs.readdirSync('./dist') : 'N/A');
// DEBUG END (remove after)
const express = require("express");
const multer = require("multer");
const fsp = require("fs/promises");
const path = require("path");
const { Server } = require("socket.io");
const { createServer } = require("node:http");

// MY-MODULES
const { readDb, writeDb, updateJSONFile, HOME_DB } = require("./dbScripts/dbFunction.js");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.NODE_ENV === 'production' 
      ? false  // Or your specific domain: "https://yourdomain.com"
      : "*" 
  },
});

const PORT = process.env.PORT || 5555;
const AUDIO_BASE_PATH = process.env.AUDIO_PATH || "./audio";
const DATASETS_PATH = process.env.DATASETS_PATH || "./datasets";

// Set env var for dbFunction.js
process.env.HOME_DB = process.env.HOME_DB || path.join(DATASETS_PATH, "home.json");

// Track user sessions
const userSessions = new Map();

/**
 * Helper: Get database path for username
 * "home" uses the special home.json, others get their own file
 */
function getUserDbPath(username) {
  if (username === "home") {
    return process.env.HOME_DB;
  }
  return path.join(DATASETS_PATH, `${username}.json`);
}

function getUserAudioPath(username) {
  return path.join(AUDIO_BASE_PATH, username);
}

/**
 * Helper: Get audio directory for username
 */
function getUserAudioPath(username) {
  return path.join(AUDIO_BASE_PATH, username);
}

/**
 * Helper: Ensure user directories exist
 * For "home", also ensure starter audio files exist
 */
async function ensureUserExists(username) {
  const audioPath = getUserAudioPath(username);
  const dbPath = getUserDbPath(username);
  
  try {
    // Create audio directory
    await fsp.mkdir(audioPath, { recursive: true });
    
    // Special case: "home" needs starter audio files
    if (username === "home") {
      const meowPath = path.join(audioPath, "meowwww.wav");
      const woofPath = path.join(audioPath, "wooooof.wav");
      
      // Check if starter files exist, if not create placeholder or copy from template
      // For now, we'll just ensure the directory exists
      // You should manually place meow.wav and woof.wav in audio/home/ as starter files
    }
    
    // Database is created by readDb if it doesn't exist
    
  } catch (err) {
    console.error(`Error ensuring user ${username}:`, err);
  }
}

// ===============
// MIDDLEWARE:
// ===============
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
app.use(express.json());
// app.use(express.static("dist"));
// app.use(express.static("src/assets"));
// app.use('/audio', express.static('audio'));
// app.use('/src/assets/images', express.static('/src/assets/images'));
// app.use(express.json());

// ===============
// MULTER: DYNAMIC STORAGE
// ===============
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const username = req.query.username || req.body.username || 'home';
    const userPath = getUserAudioPath(username);
    
    try {
      await fsp.mkdir(userPath, { recursive: true });
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

// Temporary healthcheck endpoint (DEBUG: DELETE ME AFTER)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});


// Get database for specific user
app.get("/database/:username", async (req, res) => {
  const username = req.params.username;
  await ensureUserExists(username);
  const dbPath = getUserDbPath(username);
  const data = readDb(dbPath);
  res.send(data);
});

// ================
// SOCKET.IO EVENTS:
// ================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  let currentUsername = null;

  // User joins with username
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
    
    // Join room for username-specific updates
    socket.join(currentUsername);
    
    // Send database to this socket only
    socket.emit("database", userDb);
  });

  // Handle new node upload
  socket.on("uploaded-node", (data) => {
    const nodeName = typeof data === 'string' ? data : data.nodeName;
    const username = typeof data === 'string' ? userSessions.get(socket.id) : data.username;
    
    if (!username) {
      socket.emit("error", "Not authenticated");
      return;
    }
    
    const dbPath = getUserDbPath(username);
    let database = readDb(dbPath);

    // For empty databases (new users), first node connects to nothing or itself
    // For existing databases, connect to random target
    let target = null;
    if (database.nodes.length > 0) {
      target = database.nodes[Math.floor(Math.random() * database.nodes.length)].id;
    } else {
      target = nodeName; // Self-reference for first node
    }

    const value = Math.random() * 10;
    const nodeObj = {
      id: nodeName,
      source: nodeName,
      target,
      value,
    };

    writeDb(nodeObj, dbPath);
    
    // Broadcast to all clients in this username room
    io.to(username).emit("new-node", nodeObj);
  });

  // Handle audio upload via socket
  socket.on("upload_audio", async (data) => {
    const username = userSessions.get(data.username) || data.username || 'home';
    const userAudioPath = getUserAudioPath(username);
    
    await fsp.mkdir(userAudioPath, { recursive: true });
    await fsp.writeFile(path.join(userAudioPath, `${data.name}.wav`), data.buffer);
    
    io.to(username).emit("audio-uploaded", { name: data.name, username });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    userSessions.delete(socket.id);
  });
});

const listenPort = process.env.PORT || PORT;

// DEBUGGGGG
console.log('Environment PORT:', process.env.PORT);
console.log('Using port:', PORT);

app.get('/debug-files', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const checkDir = (dir) => {
    try {
      return fs.readdirSync(dir, { recursive: true });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  };
  
  res.json({
    cwd: process.cwd(),
    dirname: __dirname,
    distExists: fs.existsSync('dist'),
    distContents: checkDir('dist'),
    assetsExists: fs.existsSync('dist/assets'),
    assetsContents: fs.existsSync('dist/assets') ? fs.readdirSync('dist/assets') : 'N/A'
  });
});

// DEBUGGGGG END


server.listen(listenPort, '0.0.0.0', () => {
  console.log(`Server running on port ${listenPort}`);
});