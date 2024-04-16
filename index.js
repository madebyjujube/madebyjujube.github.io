const express = require("express");
const multer = require("multer");
const fs = require("fs/promises");
const { Server } = require("socket.io");
const { createServer } = require("node:http");

// MY-MODULES
const { writeDb } = require("./dbScripts/dbFunction.js");
const { readDb } = require("./dbScripts/dbFunction.js");
const { updateJSONFile } = require("./dbScripts/dbFunction.js");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const databasePath = "./datasets/testdb.json";
let database = readDb(databasePath);

/**
 * readDb(databasePath)
 * reads graph database
 */

app.use(express.static("dist"));
app.use(express.json());

// ===============
// === INIT-MODEL:
// ===============
// MULTER: AUDIO FILE HANDLING - multer syntax: callback hell?
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploaded_audio/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
//

// ==============
// CLIENT-EVENTS:
// ==============
// SUBMITTED: adds new data to JSON file ():
app.get("/database", sendDb);
app.post("/node-data", writeDatatoJSON);
// USER DATA (contains: username + socket.id):
// app.post("/user-data", writeUserData)
// UPLOAD AUDIO - MULTER
app.post("/upload", upload.single("audio"), postUploadHandler);
// ==============

// ================
// == CALLBACKS:
// ================
function sendDb(req, res) {
  const data = readDb(databasePath);
  res.send(data);
}
function writeDatatoJSON(req, res) {
  updateJSONFile(req.body, databasePath);
  res.send("server received and wrote data to JSON file");
}
function postUploadHandler(req, res) {
  // writeDb( req.body, databasePath )
  writeDb({ label: req.file.originalname }, databasePath);
  res.send("audio uploaded");
}

// ================
// function updateDb(node) {
// database = readDb(databasePath)
// let countN = database.nodes.length - 1;
// let index = Math.round(Math.random() * countN);
// let target = database.nodes[index].id;
// }

//
// DATABASE, CHANGES, + CHATBOX
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("database-req", () => {
    database = readDb(databasePath);
    io.emit("database", database);
  });
  // socket.on("audio-req", () => {
  //   data = readAudio();
  //   io.emit("database", database);
  // });

  // NOTE: Renamed incoming variable to match the type of data the client sends.
  socket.on("uploaded-node", (nodeName) => {
    database = readDb(databasePath);

    // NOTE: Reused existing findTarget function
    const target = findTargetId(database);

    const nodeObj = {
      id: nodeName,
      source: nodeName,
      target,
    };

    writeDb(nodeObj);
    io.emit("new-node", nodeObj);
  });

  socket.on("upload_audio", async (data) => {
    fs.writeFile(`./uploaded_audio/${data.name}.wav`, data.buffer);
  });

  // CHAT-APP
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  // DISCONNECTED
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

function findTargetId(database) {
  // NOTE: Renamed variables to something more specific.
  let maxAvailableIndices = database.nodes.length - 2;
  let newTargetIndex = Math.round(Math.random() * maxAvailableIndices);
  let newTargetId = database.nodes[newTargetIndex].id;
  return newTargetId;
}

// START SERVER
server.listen(process.env.PORT || 5555, () => {
  console.log(`listening on port 5555`);
});

