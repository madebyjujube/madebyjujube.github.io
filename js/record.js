// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)

let mic, player, waveform, audioBuffer;

let recLimit = 5000; // Max time allowed to record in ms 

const recBtn = document.getElementById('recbtn');
const recText = document.getElementById('recText');
const cueBtn = document.getElementById('cuebtn');

const actx = Tone.context;
const audio = document.querySelector('#buffer');
const dest = actx.createMediaStreamDestination();
const recorder = new MediaRecorder(dest.stream);

let initialized = false;
let recording = false;
let playing = false;
recBtn.disabled = !Tone.UserMedia.supported;
cueBtn.disabled = true;

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
        e.target.classList.remove('recording');
        mic.disconnect();
        mic.connect(dest);
        e.target.style.backgroundImage = 'url(/assets/images/Ellipse.png)'
        recorder.stop();
        recording = false;
        cueBtn.removeAttribute('disabled');
        
    } else {
        e.target.classList.add('recording');
        mic.connect(waveform);
        recorder.start();
        recording = true;
        cueBtn.setAttribute('disabled', 1);
        setTimeout(stopRecording, recLimit); // set recording limit
    }
});


function stopRecording() {
    if (recording) {
        recBtn.click();
        recorder.stop();
    }
}
// POPULATE BUFFER: chunks[]
recorder.ondataavailable = (e) => {
    chunks.pop(); // erase previous chunk
    chunks.push(e.data);
};
recorder.onstop = () => {
    let blob = new Blob(chunks, {
        type: 'audio/wav, codecs=opus'
    });
    audio.src = URL.createObjectURL(blob);
    player = new Tone.Player(audio.src).toDestination();
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

    let canvas = createCanvas(50, 30);
    canvas.parent('p5js');

    background(0);
}

function draw() {
    if (initialized) {
        background('black');
        stroke('white');
        noFill();
        
        let buffer = waveform.getValue(0); // Get the waveform directly from Tone.Waveform
        beginShape();
        for (let i = 0; i < buffer.length; i++) {
            let x = map(i, 0, buffer.length, 0, width);
            let y = map(buffer[i], -1, 1, 0, height);
            // point(x, y);
            vertex(x, (y*3 -30));
        }
        endShape();
    }
}

// audioBuffer = new Tone.ToneAudioBuffer(blob);
// console.log(audioBuffer);