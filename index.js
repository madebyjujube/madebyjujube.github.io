const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io =  new Server(server);

app.use(express.static('public_html'));
// app.get('/', (req, res) => {
//   res.sendFile(join(__dirname, 'public_html/index.html'));
// });


// io.on('connection', newConnection) // alternatively do callback function
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
});

server.listen(3000, () => {
  console.log('listening on port 3000');
});