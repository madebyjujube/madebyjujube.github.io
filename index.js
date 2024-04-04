const { writeDb } = require('./dbScripts/dbFunction.js')

const express = require('express');
const {
  createServer
} = require('node:http');
const {
  Server
} = require('socket.io');
const multer = require('multer'); // read binary

const app = express();
const server = createServer(app);
const io = new Server(server);


app.use(express.static('public_html'));
// app.use(express.static('node_modules'));

app.use(express.json());
app.post("/receive-data", writeDatatoJSON);



// RECEIVING THIS WHEN USER SUBMITS AUDIO: 
// I WANT FILENAME TO BECOME 
  // NODE: 
    // "ID": '...',  
  // LINKS: 
    // "SOURCE": '...' 

    // "TARGET": ideally should generate random link based on node.id.length. 
    // If empty, target === source. 
function writeDatatoJSON(req, res) {
  writeDb( req.body.filename )
  res.send('server received and wrote data to JSON file');
}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('listening on port 3000');
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploaded_audio/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('audio'), postUploadHandler);

function postUploadHandler(req, res) {
  console.log(req.file);
  // writeDb( { filename: req.file.originalname} );
  res.send('server received audio, upload successful');
}