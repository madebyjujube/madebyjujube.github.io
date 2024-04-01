// what I want to do here: 
// REQUEST: audio fetch(request to UPLOAD audio and user data) to the server dataBase. 
// Create an environment to manipulate audio 
// Audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) - 
// RETRIEVE GRAPH CANVAS CENTER OF WINDOW (XYZ: 0)
// generate a random id for users when they send a request. 
// UserRequest(); Object will be used to generate the request. 

const userData = {
    id: 'randId();',
    name: '',
    fileName: '',
    mp3File: '',
    duration: '',
}; // object to store: id, name, mp3 file, duration


const request = new XMLHttpRequest();

let randId, userName, fileName, duration;

// // Something like this? Look at line 21 | .onNodeClick(...)
// function triggerAudio(id) {
//     return node => {
//         const audio = new Audio(node.id  + '.ogg');
//         audio.play();
//     }
// }