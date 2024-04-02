const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { server } = require('socket.io');

const app = express();
const server = createServer(app);
const io =  new Server(server);

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });
// app.use(express.static('public_html'));

// const socket = require('socket.io');
// const io = socket(server);

io.on('connection', newConnection)

function newConnection(socket) {
    console.log('A new connection has been made!')
    socket.on('disconnect', function() {
        console.log('A connection has been lost!')
    })
    socket.on('message', function(data) {
        console.log('Received message:'+ data)
        socket.emit('message', data)
    })
    socket.emit('message', 'Hello, World!')
}

server.listen(3000, () => {
    console.log('listening on port 3000');
});
