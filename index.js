const express = require('express')
const app = express()
app.use(express.static('public_html'))
app.use(express.json())

const { Server } = require('socket.io')
const { createServer } = require('node:http')
const { writeDb } = require('./dbScripts/dbFunction.js')
const { updateJSONFile } = require('./dbScripts/dbFunction.js')
// const { fileWatch } = require('./dbScripts/watch.js')
const multer = require('multer') // read binary
const server = createServer(app)
const io = new Server(server)

const fs = require('node:fs')
const databasePath = "./public_html/datasets/ono.json"
let database = JSON.parse(fs.readFileSync(databasePath))


// client submits audio: 
app.post('/node-data', writeDatatoJSON)
// USER DATA (contains username and socket id): 
app.post("/user-data", writeUserData)
function writeUserData(req, res) {
  writeDb( req.body, './public_html/datasets/user-data.json' )
}


function writeDatatoJSON(req, res) {
  console.log( req.body.nodes )
  updateJSONFile( req.body, databasePath )
  res.send('server received and wrote data to JSON file')
}


// MULTER: AUDIO FILE HANDLING
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploaded_audio/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})


const upload = multer({ storage: storage })
// POST-REQ
app.post('/upload', upload.single('audio'), postUploadHandler)
// RESPONSE
function postUploadHandler(req, res) {
  // writeDb( { filename: req.file.originalname} )
  res.send('audio uploaded')
}



// DATABASE, CHANGES, + CHATBOX
io.on('connection', (socket) => {
  console.log('a user connected', socket.id)


  socket.emit('init-database', database)
  // console.log(database)



  // Watch for changes in the file, and send it to client
  const watcher = fs.watch(databasePath, (eventType, filename) => {
    console.log(`event type is: ${eventType}`)
    // If there is a change in the file
    if (eventType === 'change') {
      database = JSON.parse(fs.readFileSync(databasePath))
      // Emit a message to the client
      socket.emit('database-changed', database )
    } else {
      console.log('file event: other type')
    }
  })



  
  socket.on('disconnect', () => {
    console.log('user disconnected')
    watcher.close()
  })
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg)
  })
})

// START SERVER
server.listen(process.env.PORT || 3000, () => {
  console.log(`listening on port 3000`)
})