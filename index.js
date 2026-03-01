const fs = require('fs');
const path = require('path');
const fsp = require('fs/promises');
const express = require("express");
const multer = require("multer");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const { readDb, writeDb, HOME_DB } = require("./dbScripts/dbFunction.js");

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5555;

// Environment paths
const AUDIO_BASE_PATH = process.env.AUDIO_PATH || "./audio";
const DATASETS_PATH = process.env.DATASETS_PATH || "./datasets";
process.env.HOME_DB = process.env.HOME_DB || path.join(DATASETS_PATH, "home.json");

// Socket.io setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const userSessions = new Map();

// ============ SEEDING ============
async function seedStarterFiles() {
  const appAudio = '/app/audio';
  const appDatasets = '/app/datasets';
  
  if (!fs.existsSync(appAudio)) {
    console.log('No /app/audio found, skipping seed');
    return;
  }
  
  console.log('Seeding from /app/audio to', AUDIO_BASE_PATH);
  
  try {
    await fsp.mkdir(AUDIO_BASE_PATH, { recursive: true });
    const entries = await fsp.readdir(appAudio, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const srcDir = path.join(appAudio, entry.name);
      const destDir = path.join(AUDIO_BASE_PATH, entry.name);
      await fsp.mkdir(destDir, { recursive: true });
      
      const files = await fsp.readdir(srcDir);
      for (const file of files) {
        const src = path.join(srcDir, file);
        const dest = path.join(destDir, file);
        if (!fs.existsSync(dest)) {
          await fsp.copyFile(src, dest);
          console.log(`Seeded: ${entry.name}/${file}`);
        }
      }
    }
    
    // Seed datasets
    if (fs.existsSync(appDatasets)) {
      await fsp.mkdir(DATASETS_PATH, { recursive: true });
      const files = await fsp.readdir(appDatasets);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const src = path.join(appDatasets, file);
        const dest = path.join(DATASETS_PATH, file);
        if (!fs.existsSync(dest)) {
          await fsp.copyFile(src, dest);
          console.log(`Seeded dataset: ${file}`);
        }
      }
    }
    
    console.log('Seeding complete');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

// ============ HELPERS ============
function getUserDbPath(username) {
  return username === "home" ? process.env.HOME_DB : path.join(DATASETS_PATH, `${username}.json`);
}

function getUserAudioPath(username) {
  return path.join(AUDIO_BASE_PATH, username);
}

async function ensureUserExists(username) {
  const audioPath = getUserAudioPath(username);
  try {
    await fsp.mkdir(audioPath, { recursive: true });
  } catch (err) {
    console.error(`Error ensuring user ${username}:`, err);
  }
}

// ============ MIDDLEWARE ============
app.use(express.json());

// ============ ROUTES ============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get("/database/:username", async (req, res) => {
  const username = req.params.username;
  await ensureUserExists(username);
  const data = readDb(getUserDbPath(username));
  res.send(data);
});

// Static files
app.use('/audio', express.static(AUDIO_BASE_PATH));
app.use(express.static(path.join(__dirname, 'dist')));

// SPA catch-all
app.get('*', (req, res) => {
  if (req.path.startsWith('/database') || req.path.startsWith('/health') || req.path.startsWith('/audio')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============ MULTER ============
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const username = req.query.username || req.body.username || 'home';
    const userPath = getUserAudioPath(username);
    await fsp.mkdir(userPath, { recursive: true });
    cb(null, userPath);
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// ============ SOCKET.IO ============
io.on("connection", (socket) => {
  let currentUsername = null;

  socket.on("join-database", async (username) => {
    if (!username?.trim()) {
      socket.emit("error", "Invalid username");
      return;
    }
    
    currentUsername = username.trim();
    userSessions.set(socket.id, currentUsername);
    await ensureUserExists(currentUsername);
    
    socket.join(currentUsername);
    socket.emit("database", readDb(getUserDbPath(currentUsername)));
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
    
    const target = database.nodes.length > 0 
      ? database.nodes[Math.floor(Math.random() * database.nodes.length)].id
      : nodeName;

    const nodeObj = {
      id: nodeName,
      source: nodeName,
      target,
      value: Math.random() * 10
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
    userSessions.delete(socket.id);
  });
});

// ============ START ============
seedStarterFiles().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});