// Communication protocol
// from client
socket.emit('from-client', (arg) => {
    arg = 'argument';
});
// to server
io.on('connection', (socket) => {
    socket.on('from-client', (arg) => {
        console.log(arg); // 'argument'
    });
});

// from server
io.on('connection', (socket) => {
    socket.emit('from-server', (arg) => {
        arg = 'argument';
    });
});
// to client
socket.on('from-server', (arg) => {
    console.log(arg); // 'argument'
});