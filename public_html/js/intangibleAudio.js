// what I want to do here: 
// REQUEST: audio fetch(request to UPLOAD audio and user data) to the server dataBase. 
// Create an environment to manipulate audio 
// Audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) - 
// RETRIEVE GRAPH CANVAS CENTER OF WINDOW (XYZ: 0)
// generate a random id for users when they send a request. 
// UserRequest(); Object will be used to generate the request. 
const socket = io();
let randId, userName, fileName, duration;

// RECORD VARS
var recTimer, countInt;
let mic, player, waveform, audioBuffer;

let time = 5;
let recLimit = time * 1000; // Max time allowed to record in ms 

// CALLBACK FN
// const countInterval = setInterval(count, 1000);
const recBtn = document.getElementById('recbtn');
const recText = document.getElementById('recText');
const cueBtn = document.getElementById('cuebtn');

const actx = Tone.context;
const audio = document.querySelector('#buffer');
const dest = actx.createMediaStreamDestination();
const recorder = new MediaRecorder(dest.stream);

// login submission
const inputID = document.getElementById('username');
const loginBtn = document.getElementById('loginbtn');
const editBtn = document.getElementById('editbtn');
const uploadBtn = document.getElementById('uploadBtn');
const nodeName = document.getElementById('nodename');
const audioWarpper = document.getElementById('audio-warpper');

let initialized = false;
let recording = false;
let playing = false;
recBtn.disabled = !Tone.UserMedia.supported;
cueBtn.disabled = true;
uploadBtn.disabled = true;
nodeName.disabled = true;
audioWarpper.disabled = true;

const userData = {
    id: 'randId();',
    name: '',
    fileName: '',
    mp3File: '',
    duration: '',
};

loginBtn.addEventListener('click', (e) => {
    let isFormValid = inputID.checkValidity();
    if (!isFormValid) {
        inputID.reportValidity();
    } else {
        e.preventDefault();
        inputID.disabled = true;
        loginBtn.style.display = 'none';
        editBtn.style.display = 'flex';
        console.log('hi');
        userData.name = inputID.value;
        console.log(userData);
        fetch('/receive-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => {
                console.error(error);
                // alert('Error:'+ error);
            })
    }
});

// RECORDER BELOW :)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)


waveform = new Tone.Waveform();
Tone.Master.volume.value = 0;
// Create an array to store the audio
const chunks = [];

// START/STOP RECORDER (first UI event)
recBtn.addEventListener("click", async (e) => {
    if (Tone.context.state !== "running") {
        Tone.start();
    }
    //   MIC INIT
    if (!initialized) {
        mic = new Tone.UserMedia();
        mic.open();
        mic.connect(dest);
        initialized = true;
    }

    if (recording == true) {
        recBtn.classList.remove('recording');
        recBtn.style.backgroundImage = 'url(../assets/images/Ellipse.png)'
        cueBtn.removeAttribute('disabled');
        mic.disconnect();
        mic.connect(dest);
        recorder.stop();
        recording = false;
        clearTimeout(recTimer);
        clearInterval(countInt);
        recBtn.innerHTML = '';

    } else {
        recBtn.classList.add('recording');
        cueBtn.setAttribute('disabled', 1);
        mic.connect(waveform);
        recorder.start();
        recording = true;
        recBtn.innerHTML = '5';
        startTimer();
        // updateCountdown();
    }
});

// COUNTDOWN
function count() {
    if (time > -1) {
        updateCountdown();
    } else {
        // stopRecording();
        recBtn.innerHTML = '';
        clearInterval(countInt);
        time = 5;
    }
}

function updateCountdown() {
    time--;
    recBtn.innerHTML = `${time}`;
}

// RECORDING TIMER
function startTimer() {
    countInt = setInterval(count, 1000);
    recTimer = window.setTimeout(stopRecording, recLimit);
}
// ON STOP RECORDING
function stopRecording() {
    clearInterval(countInt)
    recBtn.innerHTML = '';
    time = 5;
    if (recording) {
        recBtn.click();
        recorder.stop();
    }
}

nodeName.addEventListener('input', () => {
    uploadBtn.removeAttribute('disabled');
});

// POPULATE BUFFER: chunks[]
recorder.ondataavailable = (e) => {
    nodeName.removeAttribute('disabled');
    chunks.pop(); // erase previous chunk
    chunks.push(e.data);
};
recorder.onstop = () => {
    let blob = new Blob(chunks, {
        type: 'audio/wav, codecs=opus'
    });
    // add input field and get input.value = filename
    let filename = 'name me soon';
    let file = new File([blob], `${filename}.wav`);

    audio.src = URL.createObjectURL(blob);
    player = new Tone.Player(audio.src).toDestination();

    uploadBtn.addEventListener('click', async (e) => {
        console.log('hi');
        e.preventDefault();
        const formData = new FormData();
        formData.append('audio', file, `${filename}.wav`);
        formData.append('test', 'bananas')

        const response = await fetch('/upload', {
            method: 'POST',
            cache: 'no-cache',
            body: formData
        })
        console.log(await response.text());
    });
};

// PLAY RECORDED AUDIO + UI 
cueBtn.onclick = () => {

    if (playing === false) {
        audio.play();
        player.start();
        player.connect(waveform);
        cueBtn.classList.add('playing');
        playing = true;

    } else {
        player.stop();
        cueBtn.classList.remove('playing');
        playing = false;
    }
};
audio.onended = () => {
    cueBtn.classList.remove('playing');
    playing = false;
};

// ======================================================
// ======================= DRAW =========================
// ======================= P5JS =========================
// ======================================================
function setup() {
    cx = width / 2;
    cy = height / 2;

    let canvas = createCanvas(95, uiH);
    canvas.parent('p5js');

    background(0);
}

function draw() {
    if (initialized) {
        background('black');
        stroke('white');
        noFill();

        let buffer = waveform.getValue(0); // Get the waveform directly from Tone.Waveform
        // scale(0.5);
        beginShape();
        for (let i = 0; i < buffer.length; i++) {
            let x = map(i, 0, buffer.length, 0, width);
            let y = map(buffer[i], -0.5, 0.5, 0, height);
            // point(x, y);
            vertex(x, y);
        }
        endShape();
    }
}