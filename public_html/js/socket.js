// Communication protocol
// from client
socket.emit('client-event', (arg) => {
    arg = 'argument';
});
// to server
io.on('connection', (socket) => {
    socket.on('client-event-1', (arg) => {
        console.log(arg); // 'argument'
    });
});

// from server
io.on('connection', (socket) => {
    socket.emit('server-event', (arg) => {
        arg = 'argument';
    });
});
// to client
socket.on('server-event', (arg) => {
    console.log(arg); // 'argument'
});