const express = require('express');
const {
  createServer
} = require('node:http');
const {
  Server
} = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public_html'));

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('client-event-1', (arg) => {
    console.log(arg); // 'world'
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('listening on port 3000');
});