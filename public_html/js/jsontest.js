let url = '../datasets/ono-2.json';
async function getJSON() {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    console.log(data.nodes[0].id)
    return data.nodes[0].id;
}
getJSON();

console.log(getJSON);

// // Assuming you have a WebSocket connection established using Socket.IO
// const socket = io();

// // On form submission
// document.getElementById('testBtn').addEventListener('click', () => {
//     const audioFileName = document.getElementById('testInput').value;

//     // Send data to the server
//     socket.emit('newAudioFile', { fileName: audioFileName });
// });

// // Listen for updates from the server
// socket.on('jsonUpdate', (updatedData) => {
//     // Update visualization/graph using updatedData
// });
