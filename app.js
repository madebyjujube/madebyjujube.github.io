const express = require('express')
const multer = require('multer')
const fs = require('node:fs')
const { Server } = require('socket.io')
const { createServer } = require('node:http')

// MY-MODULES
const { writeDb } = require('./dbScripts/dbFunction.js')
const { readDb } = require('./dbScripts/dbFunction.js')
const { updateJSONFile } = require('./dbScripts/dbFunction.js')

const app = express()
const server = createServer(app)
const io = new Server(server)

const databasePath = "./public_html/datasets/ono.json"
let database = readDb()

app.use(express.static('public_html'))
app.use(express.json())

// ===============
// === INIT-MODEL:
// ===============
// MULTER: AUDIO FILE HANDLING - multer syntax: callback hell?
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './uploaded_audio/')
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
    const upload = multer({ storage: storage })
//

// ==============
// CLIENT-EVENTS:
// ==============
    // SUBMITTED: adds new data to JSON file
    app.post('/node-data', writeDatatoJSON)
    // USER DATA (contains: username + socket.id): 
    // app.post("/user-data", writeUserData)
    // UPLOAD AUDIO - MULTER
    app.post('/upload', upload.single('audio'), postUploadHandler)
    // ==============




// ================
// == CALLBACK-DEF:
// ================
    function writeDatatoJSON(req, res) {
        updateJSONFile( req.body, databasePath )
        res.send('server received and wrote data to JSON file')
    }
    function postUploadHandler(req, res) {
        // writeDb( req.body, databasePath )
        writeDb( { label: req.file.originalname}, databasePath )
        res.send('audio uploaded')
    }
// 


// DATABASE, CHANGES, + CHATBOX
io.on('connection', (socket) => {
    readDb(databasePath)
    console.log('a user connected', socket.id)

    socket.emit('init-database', database)
    // console.log(database)

    // Watch for changes in the file, and send it to client
    const watcher = fs.watch(databasePath, (eventType, filename) => {

        console.log(`event type is: ${eventType}`)
        // If there is a change in the file
        if (eventType === 'change') {
            let database = readDb(databasePath)
            // Emit database to client
            socket.emit('database-changed', database)
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
server.listen(process.env.PORT || 5555, () => {
  console.log(`listening on port 5555`)
})