// want to add audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) - 
const socket = io()
const waveform = new Tone.Waveform()

let source, userData

// rec-vars
var recTimer, countInt
let mic, player

let time = 5
let recLimit = time * 1000 // Max time allowed to record in ms 

const recBtn = document.getElementById('recbtn')
const cueBtn = document.getElementById('cuebtn')
const actx = Tone.context
const audio = document.querySelector('#buffer')
const dest = actx.createMediaStreamDestination()
const recorder = new MediaRecorder(dest.stream)
//

const inputID = document.getElementById('username')
const loginBtn = document.getElementById('loginbtn')
const editBtn = document.getElementById('editbtn')
const uploadBtn = document.getElementById('uploadBtn')
const nodeName = document.getElementById('nodename')

let initialized = false;
let recording = false
let playing = false

main()
function main() {
    // states
    recBtn.disabled = !Tone.UserMedia.supported
    cueBtn.disabled = true
    loginBtn.disabled = true
    uploadBtn.disabled = true
    nodeName.disabled = true
    recBtn.disabled = true
    // events
    loginBtn.addEventListener('click', loginBtnClick)
    editBtn.addEventListener('click', editBtnClick)
    inputID.addEventListener('input', inputClick)
    recBtn.addEventListener('click', () => {
        initAudio()
        startStopRec()
    })
    cueBtn.addEventListener('click', cueBtnClick)
    nodeName.addEventListener('input', allowSubmit)
}

async function myDatabase() {
    let url = '../datasets/ono.json'

    const response = await fetch(url)
    const data = await response.json()
    let numNodes = data.nodes.length
    let index = Math.round(Math.random() * numNodes)
    let nameNode = data.nodes[index].id
    return nameNode
}


socket.on('connect', async () => {
    source = socket.io.engine.id
    userData = await {
        id: source
    }
})


function loginBtnClick(e) {
    let isFormValid = inputID.checkValidity()
    if (!isFormValid) {
        inputID.reportValidity()
    } else {
        e.preventDefault()
        inputID.disabled = true
        recBtn.removeAttribute('disabled')
        loginBtn.style.display = 'none'
        editBtn.style.display = 'flex'
        userData.username = inputID.value
        console.log("USERNAME ADDED", userData)
    }
}
function editBtnClick(e) {
    e.preventDefault()
    inputID.removeAttribute('disabled')
    loginBtn.style.display = 'flex'
    editBtn.style.display = 'none'
}
function inputClick() {
    loginBtn.removeAttribute('disabled')
}

// RECORDER BELOW :)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)

Tone.Master.volume.value = 0
// Create an array to store the audio
const chunks = []

// START/STOP RECORDER (first UI event)
function initAudio() {
    if (Tone.context.state !== "running") {
        Tone.start()
    }
    //   MIC INIT
    if (!initialized) {
        mic = new Tone.UserMedia()
        mic.open()
        mic.connect(dest)
        initialized = true
    }
}
function startStopRec() {
    if (recording == true) {
        startRecord()
    } else {
        stopRecord()
    }
}
function startRecord() {
    recordingStyle()
    mic.disconnect()
    mic.connect(dest)
    recorder.stop()
    recording = false
    clearTimeout(recTimer)
    clearInterval(countInt)
    recBtn.innerHTML = ''
}
function stopRecord() {
    notRecordingStyle()
    myDatabase() // check current node count :)

    mic.connect(waveform)
    recorder.start()
    recording = true

    recBtn.innerHTML = '5'
    setInterval(count, 1000)
    startTimer()
}

function recordingStyle() {
    recBtn.classList.remove('recording')
        recBtn.style.backgroundImage = 'url(../assets/images/Ellipse.png)'
        cueBtn.removeAttribute('disabled')
}
function notRecordingStyle() {
    recBtn.classList.add('recording')
    cueBtn.setAttribute('disabled', 1)
}

// COUNTDOWN
function count() {
    if (time > -1) {
        time--
        recBtn.innerHTML = `${time}`
    } else {
        recBtn.innerHTML = ''
        clearInterval(countInt)
        time = 5
    }
}

// RECORDING TIMER
function startTimer() {
    // countInt = setInterval(count, 1000)
    recTimer = window.setTimeout(stopRecording, recLimit)
}

// ON INPUT => MAKE BTN AVAILABLE
function allowSubmit() {
    if (nodeName.innerText.length < 1) {
        uploadBtn.disabled = true
    } else {
        uploadBtn.removeAttribute('disabled')
    }
}

// POPULATE BUFFER: chunks[]
recorder.ondataavailable = (e) => {
    nodeName.removeAttribute('disabled')
    chunks.pop() // erase previous chunk
    chunks.push(e.data)
}

// ON STOP RECORDING => 
// - create new blob + add it to audio. 
// - listen for uploadBtn click
// - SERVER: 
// - upload audio file
// - send file name to database
recorder.onstop = () => {
    let blob = new Blob(chunks, {
        type: 'audio/wav, codecs=opus'
    })
    // add input field and get input.value = filename

    audio.src = URL.createObjectURL(blob)
    player = new Tone.Player(audio.src).toDestination()

    uploadBtn.addEventListener('click', async (e) => {
        // if (state == false) return

        e.preventDefault()
        let filename = nodeName.value
        let file = new File([blob], `${filename}.wav`)
        const formData = new FormData()
        formData.append('audio', file, `${filename}.wav`)

        const response = await fetch('/upload', {
            method: 'POST',
            cace: 'no-cache',
            body: formData
        })
        console.log('audio sent to server! thank you :3', formData)

        let newGraph = {
            nodes: [
                { 
                    id: filename 
                }
            ],
            links: [
                { 
                    source: filename,
                    target:  myDatabase()
                }
            ]
        }

        fetch('/node-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newGraph)
            })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => {
                console.error(error)
            })
        console.log(await response.text())
        console.log("NODENAME ADDED AND AUDIO SENT", JSON.stringify(newGraph))
    })
}

// PLAY RECORDED AUDIO + UI 
function cueBtnClick() {
    if (playing === false) {
        audio.play()
        player.start()
        player.connect(waveform)
        cueBtn.classList.add('playing')
        playing = true
    
    } else {
        player.stop()
        cueBtn.classList.remove('playing')
        playing = false
    }
}
audio.onended = () => {
    cueBtn.classList.remove('playing')
    playing = false
}



// ======================================================
// ======================= DRAW =========================
// ======================= P5JS =========================
// ======================================================

function setup() {
    
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const uiH = style.getPropertyValue('--ui-el-h').slice(0, -2);

    cx = width / 2;
    cy = height / 2;

    let canvas = createCanvas(95, uiH);
    canvas.parent('p5js');

    background(0);
}

function draw() {
    // if (initialized) {
        background('black');
        stroke('white');
        noFill();
        let buffer = waveform.getValue(0);
        beginShape();
        for (let i = 0; i < buffer.length; i++) {
            let x = map(i, 0, buffer.length, 0, width);
            let y = map(buffer[i], -0.5, 0.5, 0, height);
            vertex(x, y);
        }
        endShape();
    // }
}