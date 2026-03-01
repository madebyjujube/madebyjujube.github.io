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

// RAILWAY: Use process.env.PORT (Railway assigns this dynamically)
const PORT = process.env.PORT || 5555;

// RAILWAY: CORS - allow all origins for Railway's dynamic domains
const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  },
});

// RAILWAY: Use environment variables (these are set in Railway dashboard)
const AUDIO_BASE_PATH = process.env.AUDIO_PATH || "./data/audio";
const DATASETS_PATH = process.env.DATASETS_PATH || "./data/datasets";

// Ensure env vars are set for dbFunction.js
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

// ===============
// API ROUTES FIRST (before static files)
// ===============

// HEALTHCHECK - Railway needs this at a reliable endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      port: PORT,
      audioPath: AUDIO_BASE_PATH,
      datasetsPath: DATASETS_PATH,
      homeDb: process.env.HOME_DB
    }
  });
});

// Debug endpoint
app.get('/debug-server', (req, res) => {
  res.json({
    cwd: process.cwd(),
    __dirname: __dirname,
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    audioBasePath: AUDIO_BASE_PATH,
    audioBasePathResolved: path.resolve(AUDIO_BASE_PATH),
    audioExists: fs.existsSync(AUDIO_BASE_PATH),
    audioContents: fs.existsSync(AUDIO_BASE_PATH) ? fs.readdirSync(AUDIO_BASE_PATH, {recursive: true}) : 'N/A',
    datasetsPath: DATASETS_PATH,
    datasetsPathResolved: path.resolve(DATASETS_PATH),
    datasetsExists: fs.existsSync(DATASETS_PATH),
    datasetsContents: fs.existsSync(DATASETS_PATH) ? fs.readdirSync(DATASETS_PATH) : 'N/A',
    homeDb: process.env.HOME_DB,
    homeDbExists: fs.existsSync(process.env.HOME_DB),
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

// RAILWAY: Ensure /data directories exist (they should persist on Railway)
async function ensureDataDirs() {
  try {
    await fsp.mkdir(AUDIO_BASE_PATH, { recursive: true });
    await fsp.mkdir(DATASETS_PATH, { recursive: true });
    console.log('Data directories ensured:', AUDIO_BASE_PATH, DATASETS_PATH);
  } catch (err) {
    console.error('Error creating data directories:', err);
  }
}
ensureDataDirs();

// Serve audio files from the persistent volume
app.use('/data/audio', express.static(AUDIO_BASE_PATH));

// Serve built frontend files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Catch-all: serve index.html for any non-API route (SPA support)
  app.get('*', (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/database') || req.path.startsWith('/health') || req.path.startsWith('/debug') || req.path.startsWith('/data/audio')) {
      return res.status(404).send('Not found');
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('Warning: dist folder not found at', distPath);
  app.get('/', (req, res) => {
    res.send('Server running - dist folder not built yet. Run npm run build.');
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
    
    try {
      await fsp.mkdir(userAudioPath, { recursive: true });
      await fsp.writeFile(path.join(userAudioPath, `${data.name}.wav`), data.buffer);
      io.to(username).emit("audio-uploaded", { name: data.name, username });
    } catch (err) {
      console.error('Error saving audio:', err);
      socket.emit('error', 'Failed to save audio');
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    userSessions.delete(socket.id);
  });
});

// START SERVER
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Audio path: ${AUDIO_BASE_PATH}`);
  console.log(`Datasets path: ${DATASETS_PATH}`);
  console.log(`HOME_DB: ${process.env.HOME_DB}`);
});