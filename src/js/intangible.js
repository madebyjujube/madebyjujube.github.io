/*
 * -manipulates login
 * - manips UI elements
 *    sets toneejs recorder & player
 *    has node name input
 *
 *
 */
// want to add audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) -
import { io } from "socket.io-client";
import * as Tone from "tone";
import { Audio } from "./audio";

// networking
//
const EXPRESS_PORT = 5555;
const ROOT_URL =
  window.location.hostname === "localhost"
    ? window.location.protocol +
      "//" +
      window.location.hostname +
      ":" +
      EXPRESS_PORT
    : window.location.origin;

const socket = io("http://localhost:" + EXPRESS_PORT);

// sound
const audio = new Audio();
const recorder = new MediaRecorder(audio.dest.stream);
//

// state
//
var recTimer, countInt;
let time = 5;
let recLimit = time * 1000; // Max time allowed to record in ms

let initialized = false;
let recording = false;
let playing = false;

/**
 * @typedef UserData
 * @prop {string} username
 */

/** @type UserData */
let userData = {
  username: "",
};

// element refs
//
const recBtn = document.getElementById("recbtn");
const cueBtn = document.getElementById("cuebtn");

/**
 * HTMLElement that plays back recordings.
 */
const audioPlayerElement = document.querySelector("#buffer");

const inputID = document.getElementById("username");
const loginBtn = document.getElementById("loginbtn");
const editBtn = document.getElementById("editbtn");
const uploadBtn = document.getElementById("uploadBtn");
const nodeName = document.getElementById("nodename");

export function uiInit() {
  // states
  recBtn.disabled = !Tone.UserMedia.supported;
  cueBtn.disabled = true;
  loginBtn.disabled = true;
  uploadBtn.disabled = true;
  nodeName.disabled = true;
  recBtn.disabled = true;

  // events

  window.addEventListener("click", audio.start, { once: true });
  window.addEventListener("keydown", audio.start, { once: true });

  loginBtn.addEventListener("click", loginBtnClick);
  editBtn.addEventListener("click", editBtnClick);
  inputID.addEventListener("input", inputClick);
  recBtn.addEventListener("click", (e) => {
    startStopRec(e);
    enableUploadButtonIf();
  });

  cueBtn.addEventListener("click", cueBtnClick);
  nodeName.addEventListener("input", enableUploadButtonIf);
  recBtn.removeAttribute("disabled");
  uploadBtn.addEventListener("click", uploadBtnCallback);

  // POPULATE BUFFER: chunks[]
  recorder.ondataavailable = recorderOnDataCallback;

  recorder.onstop = recorderOnStopCallback;

  audioPlayerElement.onended = audioPlayerOnEndedCallback;
}

function audioPlayerOnEndedCallback() {
  cueBtn.classList.remove("playing");
  playing = false;
}

function recorderOnDataCallback(e) {
  nodeName.removeAttribute("disabled");
  audio.addToBuffer(e.data);
}

/**
 * ON STOP RECORDING =>
 * - create new blob + add it to audio.
 * - listen for uploadBtn click
 * - SERVER:
 * - upload audio file
 * - send file name to database
 */
function recorderOnStopCallback() {
  const blob = new Blob(audio.recordingBuffer, {
    type: "audio/wav, codecs=opus",
  });

  const bufferURL = URL.createObjectURL(blob);
  audioPlayerElement.src = bufferURL;
  audio.setPlayerURL(bufferURL);
}

async function uploadBtnCallback(e) {
  // if (state == false) return

  e.preventDefault();
  let filename = nodeName.value;

  // let buffer = await blob.arrayBuffer();
  let buffer = audio.recordingBuffer;
  // let file = new File([blob], `${filename}.wav`);
  // const formData = new FormData();
  // formData.append("audio", file, `${filename}.wav`);

  socket.emit("upload_audio", { buffer, name: nodeName.value });
  // console.log("audio sent to server! thank you :3", formData);
  console.log("audio sent to server! thank you :3");

  let newGraph = {
    nodes: [
      {
        id: filename,
      },
    ],
    links: [
      {
        source: filename,
        // TODO: find target from existing graph
        target: "moo",
      },
    ],
  };
  socket.emit("newNode", newGraph);

  // console.log(await response.text())
  // console.log("NODENAME ADDED AND AUDIO SENT", JSON.stringify(newGraph))
}

function loginBtnClick(e) {
  let isFormValid = inputID.checkValidity();
  if (!isFormValid) {
    inputID.reportValidity();
  } else {
    e.preventDefault();
    inputID.disabled = true;
    recBtn.removeAttribute("disabled");
    loginBtn.style.display = "none";
    editBtn.style.display = "flex";
    userData.username = inputID.value;
  }
}
function editBtnClick(e) {
  e.preventDefault();
  inputID.removeAttribute("disabled");
  loginBtn.style.display = "flex";
  editBtn.style.display = "none";
}
function inputClick() {
  loginBtn.removeAttribute("disabled");
}

// RECORDER BELOW :)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)
// :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-) :-)

function startStopRec(e) {
  if (!recording) {
    startRecord(e);
  } else {
    stopRecord(e);
  }
}

function startRecord(e) {
  // findTarget //
  setRecordingStyle();
  audio.mic.connect(audio.waveform);
  recorder.start();
  recording = true;
  e.innerHTML = "5";
  startTimer();
}
function stopRecord() {
  uploadBtn.disabled = true;
  removeRecordingStyle();
  clearTimeout(recTimer);
  stopTimer();
  recBtn.innerHTML = "";

  audio.resetMic();
  recorder.stop();
  recording = false;
}

function removeRecordingStyle() {
  recBtn.classList.remove("recording");
  recBtn.style.backgroundImage = "url(/src/assets/images/Ellipse.png)";
  cueBtn.removeAttribute("disabled");
}
function setRecordingStyle() {
  recBtn.classList.add("recording");
  cueBtn.setAttribute("disabled", 1);
}

// COUNTDOWN
function count() {
  if (time > 0) {
    recBtn.innerHTML = `${time}`;
    time--;
  } else {
    stopTimer();
  }
}

// RECORDING TIMER
function startTimer() {
  count();
  countInt = setInterval(count, 1000);
  recTimer = window.setTimeout(stopRecord, recLimit);
}

function stopTimer() {
  clearInterval(countInt);
  recBtn.innerHTML = "";
  time = 5;
}

// ON INPUT => MAKE uploadBtn AVAILABLE
/**
 *
 */
function enableUploadButtonIf() {
  const val = nodeName.value;
  if (!val || recording) {
    uploadBtn.disabled = true;
    return;
  }
  const trimmed = val.trim();
  if (trimmed || !recording) {
    uploadBtn.removeAttribute("disabled");
  } else {
    uploadBtn.disabled = true;
  }
}

// PLAY RECORDED AUDIO + UI
function cueBtnClick() {
  if (playing === false) {
    audioPlayerElement.play();
    audio.player.start();
    audio.player.connect(audio.waveform);
    cueBtn.classList.add("playing");
    playing = true;
  } else {
    audio.player.stop();
    cueBtn.classList.remove("playing");
    playing = false;
  }
}

