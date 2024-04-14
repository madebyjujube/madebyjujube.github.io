const express = require('express')
const multer = require('multer')
const fs = require('fs/promises')
const { Server } = require('socket.io')
const { createServer } = require('node:http')

// MY-MODULES
const { writeDb } = require('./dbScripts/dbFunction.js')
const { readDb } = require('./dbScripts/dbFunction.js')
const { updateJSONFile } = require('./dbScripts/dbFunction.js')

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: { origin: '*' }
})

const databasePath = "./datasets/ono.json"
let database = readDb(databasePath)

app.use(express.static('dist'))
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
    app.get('/database', sendDb)
    app.post('/node-data', writeDatatoJSON)
    // USER DATA (contains: username + socket.id): 
    // app.post("/user-data", writeUserData)
    // UPLOAD AUDIO - MULTER
    app.post('/upload', upload.single('audio'), postUploadHandler)
    // ==============




// ================
// == CALLBACKS:
// ================
    function sendDb(req, res) {
        const data = readDb(databasePath)
        res.send(data)
    }
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
    /** 
     * AUDIO FILE UPLOADED 
     * 
     * */ 
    socket.on('newNode', (arg) => {
        console.log('newNode',arg);
    })
    socket.on('upload_audio', async (data) => {
        console.log({data, type: typeof data.buffer})
        fs.writeFile(`./uploaded_audio/${data.name}.wav`, data.buffer)
    })
    
    // lets see if this works:
    io.emit('send-database', database)
    // readDb(databasePath)
    
    console.log('a user connected', socket.id)
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
    // CHAT APP
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg)
    })
})

// START SERVER
server.listen(process.env.PORT || 5555, () => {
  console.log(`listening on port 5555`)
})