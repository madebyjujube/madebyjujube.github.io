// what I want to do here: 
// REQUEST: audio fetch(request to UPLOAD audio and user data) to the server dataBase. 
// Create an environment to manipulate audio 
// Audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) - 
// RETRIEVE GRAPH CANVAS CENTER OF WINDOW (XYZ: 0)
// generate a random id for users when they send a request. 
// UserRequest(); Object will be used to generate the request. 
let randId, userName, fileName, duration;

// login submission
const inputID = document.getElementById('username');
const submitID = document.getElementById('loginbtn');

const userData = {
    id: 'randId();',
    name: '',
    fileName: '',
    mp3File: '',
    duration: '',
}; // object to store: id, name, mp3 file, duration
inputID.addEventListener('submit', function(e) {
    pushUserName();
    e.preventDefault();
});
// submitID.addEventListener('click', (e) => {
//     pushUserName();
//     e.preventDefault();
// });

function pushUserName() {
    userData.name = inputID.value;
    console.log(userData);
    fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => {
        console.error(error);
        alert('Error:'+ error);
    })
}






// const request = new XMLHttpRequest();


// // Something like this? Look at line 21 | .onNodeClick(...)
// function triggerAudio(id) {
//     return node => {
//         const audio = new Audio(node.id  + '.ogg');
//         audio.play();
//     }
// }