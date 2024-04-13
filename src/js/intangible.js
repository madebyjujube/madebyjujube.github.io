// want to add audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) - 
import { io } from "socket.io-client"
import * as Tone from 'tone'

const EXPRESS_PORT = 5555;
const ROOT_URL = window.location.hostname === "localhost"
    ? window.location.protocol + '//' + window.location.hostname + ":" + EXPRESS_PORT
    : window.location.origin

const socket = io("http://localhost:" + EXPRESS_PORT)
export const waveform = new Tone.Waveform()


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
    recBtn.addEventListener('click', (e) => {
        if (!initialized) {
            initAudio()
        } else {
            startStopRec(e)
            allowUpload()
        }
    })
    cueBtn.addEventListener('click', cueBtnClick)
    nodeName.addEventListener('input', allowUpload)
    recBtn.removeAttribute('disabled')
}

// promise maker: check db 
// async function getDatabase() {
//     // let url = '../assets/datasets/ono.json'
//     const response = await fetch(url)
//     console.log(response)
//     try {
//         const data = await response.json()
//     }
//     catch(e) {
//        console.log("json parsing error:", e) 
//     }
    
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve(data)
//             reject('error')
//         }, 100)
//     })
// }
// // promise receiver: determine target

// function findTarget(data) {
//     let countNodes = data.nodes.length
//     let randIndex = Math.round(Math.random() * countNodes)
//     let newTarget = data.nodes[randIndex].id
//     return newTarget

// }
// function onSuccess(data) {
//     console.log('success:', data)
// }
// function onError(error) {
//     console.log('error:', error)
// }


// let newTargetName = await getDatabase().then(onSuccess, onError).then(findTarget)
// console.log(newTargetName)


let userData = {
    username: ''
}

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
function startStopRec(e) {
    if (!recording) {
        startRecord(e)
    } else {
        stopRecord(e)
    }
}

function startRecord(e) {
    // findTarget //
    recordingStyle()
    mic.connect(waveform)
    recorder.start()
    recording = true
    e.innerHTML = '5'
    startTimer()
}
function stopRecord(e) {
    uploadBtn.disabled = true
    notRecordingStyle()
    mic.disconnect()
    mic.connect(dest)
    recorder.stop() 
    recording = false
    clearTimeout(recTimer)
    stopTimer()
    e.innerHTML = ''
}

function notRecordingStyle() {
    recBtn.classList.remove('recording')
    recBtn.style.backgroundImage = 'url(/src/assets/images/Ellipse.png)'
    cueBtn.removeAttribute('disabled')
}
function recordingStyle() {
    recBtn.classList.add('recording')
    cueBtn.setAttribute('disabled', 1)
}

// COUNTDOWN
function count() {
    if (time > 0) {
        recBtn.innerHTML = `${time}`
        time--
    } else {
        stopTimer()
    }
}

// RECORDING TIMER
function startTimer() {
    count()
    countInt = setInterval(count, 1000)
    recTimer = window.setTimeout(stopRecord, recLimit)
}
function stopTimer() {
    clearInterval(countInt)
    recBtn.innerHTML = ''
    time = 5
}

// ON INPUT => MAKE uploadBtn AVAILABLE
function allowUpload() {
    const val = nodeName.value
    if (!val || recording) {
        uploadBtn.disabled = true
        return
    }
    const trimmed = val.trim()
    if (trimmed || !recording) {
        uploadBtn.removeAttribute('disabled')
    } else {
        uploadBtn.disabled = true
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

        let buffer = await blob.arrayBuffer()
        let file = new File([blob], `${filename}.wav`)
        const formData = new FormData()
        formData.append('audio', file, `${filename}.wav`)

        socket.emit('upload_audio', {buffer, name: nodeName.value});
        // const response = await fetch('/upload', {
        //     method: 'POST',
        //     cace: 'no-cache',
        //     body: formData
        // })
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
                    target: newTargetName
                }
            ]
        }
        socket.emit('newNode', newGraph)
        // fetch('/node-data', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify(newGraph)
        //     })
        //     .then(response => response.text())
        //     .then(data => console.log(data))
        //     .catch(error => {
        //         console.error(error)
        //     })
        // console.log(await response.text())
        // console.log("NODENAME ADDED AND AUDIO SENT", JSON.stringify(newGraph))
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