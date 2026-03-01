const fs = require('fs');
const path = require('path');
const express = require("express");
const multer = require("multer");
const fsp = require("fs/promises");
const { Server } = require("socket.io");
const { createServer } = require("node:http");

// MY-MODULES
const { readDb, writeDb, updateJSONFile, HOME_DB } = require("./dbScripts/dbFunction.js");

const app = express();
const server = createServer(app);

// RAILWAY FIX: Use process.env.PORT, fallback to 5555 for local dev only
const PORT = process.env.PORT || 5555;

// RAILWAY FIX: Better CORS for production - allow all origins in production 
// (you can restrict this to your specific domain later)
const io = new Server(server, {
  cors: { 
    origin: "*", // Allow all origins for now - Railway domains are dynamic
    methods: ["GET", "POST"]
  },
});

const AUDIO_BASE_PATH = process.env.AUDIO_PATH || "./audio";
const DATASETS_PATH = process.env.DATASETS_PATH || "./datasets";

// Set env var for dbFunction.js
process.env.HOME_DB = process.env.HOME_DB || path.join(DATASETS_PATH, "home.json");

// Track user sessions
const userSessions = new Map();

/**
 * Helper: Get database path for username
 */
function getUserDbPath(username) {
  if (username === "home") {
    return process.env.HOME_DB;
  }
  return path.join(DATASETS_PATH, `${username}.json`);
}

/**
 * Helper: Get audio directory for username
 */
function getUserAudioPath(username) {
  return path.join(AUDIO_BASE_PATH, username);
}

/**
 * Helper: Ensure user directories exist
 */
async function ensureUserExists(username) {
  const audioPath = getUserAudioPath(username);
  const dbPath = getUserDbPath(username);
  
  try {
    await fsp.mkdir(audioPath, { recursive: true });
  } catch (err) {
    console.error(`Error ensuring user ${username}:`, err);
  }
}

// ===============
// MIDDLEWARE:
// ===============
app.use(express.json());

// API ROUTES FIRST (before static files)
// ===============

// HEALTHCHECK - Railway needs this!
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get('/debug-server', (req, res) => {
  res.json({
    audioPathResolved: path.join(__dirname, 'audio'),
    cwd: process.cwd(),
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    audioExistsAtResolved: fs.existsSync(path.join(__dirname, 'audio')),
    audioDirExists: fs.existsSync('./audio'),
    audioDirContents: fs.existsSync('./audio') ? fs.readdirSync('./audio', {recursive: true}) : 'N/A',
    datasetsDirExists: fs.existsSync('./datasets'),
    datasetsDirContents: fs.existsSync('./datasets') ? fs.readdirSync('./datasets') : 'N/A',
  });
});

// Get database for specific user
app.get("/database/:username", async (req, res) => {
  const username = req.params.username;
  await ensureUserExists(username);
  const dbPath = getUserDbPath(username);
  const data = readDb(dbPath);
  res.send(data);
});

// ===============
// STATIC FILES:
// ===============
// Ensure audio directory exists
const audioPath = path.join(__dirname, 'audio');
if (!fs.existsSync(audioPath)) {
  fs.mkdirSync(audioPath, { recursive: true });
}

// Serve audio files
app.use('/audio', express.static(audioPath));

// Serve built frontend files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Catch-all: serve index.html for any non-API route (SPA support)
  app.get('*', (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/database') || req.path.startsWith('/health') || req.path.startsWith('/debug')) {
      return res.status(404).send('Not found');
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('Warning: dist folder not found. Run npm run build first.');
  // Fallback for development
  app.get('/', (req, res) => {
    res.send('Server running - dist folder not built yet');
  });
}

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

// ================
// SOCKET.IO EVENTS:
// ================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  let currentUsername = null;

  socket.on("join-database", async (username) => {
    if (!username || username.trim() === "") {
      socket.emit("error", "Invalid username");
      return;
    }
    
    currentUsername = username.trim();
    userSessions.set(socket.id, currentUsername);
    
    console.log(`User ${socket.id} joined as "${currentUsername}"`);
    
    await ensureUserExists(currentUsername);
    const dbPath = getUserDbPath(currentUsername);
    const userDb = readDb(dbPath);
    
    socket.join(currentUsername);
    socket.emit("database", userDb);
  });

  socket.on("uploaded-node", (data) => {
    const nodeName = typeof data === 'string' ? data : data.nodeName;
    const username = typeof data === 'string' ? userSessions.get(socket.id) : data.username;
    
    if (!username) {
      socket.emit("error", "Not authenticated");
      return;
    }
    
    const dbPath = getUserDbPath(username);
    let database = readDb(dbPath);

    let target = null;
    if (database.nodes.length > 0) {
      target = database.nodes[Math.floor(Math.random() * database.nodes.length)].id;
    } else {
      target = nodeName;
    }

    const value = Math.random() * 10;
    const nodeObj = {
      id: nodeName,
      source: nodeName,
      target,
      value,
    };

    writeDb(nodeObj, dbPath);
    io.to(username).emit("new-node", nodeObj);
  });

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

// START SERVER
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});