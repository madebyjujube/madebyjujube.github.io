/*
 * - manipulates form-data: (login, node-name, audio-fetch)
 * - manipulates UI-elements styles: (login, rec, cue, input, upload)
 * - creates countdown-timer: recording max duration
 * - sets Tone.js: recorder & player
 *
 *
 *
 */
// want to add audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) -
import * as Tone from "tone";
import {
  audio,
  audioPlayerElement,
  inputID,
  editBtn,
  uploadBtn,
  loginBtn,
  nodeNameElement,
  recBtn,
  cueBtn,
  socket,
} from "./main.js";

// state
//
const REC_MAX_TIME_SECS = 5;
const REC_MAX_TIME = REC_MAX_TIME_SECS * 1000; // Max time allowed to record in ms

let recTimer, countInterval;
let recTimeCounter = 5;

// actually useless?
let userData = {
  username: "",
};

export function initUi() {
  // states
  recBtn.disabled = !Tone.UserMedia.supported;
  cueBtn.disabled = true;
  loginBtn.disabled = true;
  uploadBtn.disabled = true;
  nodeNameElement.disabled = true;
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
  nodeNameElement.addEventListener("input", enableUploadButtonIf);
  uploadBtn.addEventListener("click", (e) => {
    uploadBtnCallback(e);
    enableUploadButtonIf();
    disposeRecBuffer();
  });
  audioPlayerElement.onended = audioPlayerOnEndedCallback;
}

function audioPlayerOnEndedCallback() {
  cueBtn.classList.remove("playing");
}

/**
 * ON STOP RECORDING =>
 * - create new blob + add it to audio.
 * - listen for uploadBtn click
 * - SERVER:
 * - upload audio file
 * - send file name to database
 */
async function uploadBtnCallback(e) {
  // if (state == false) return
  e.preventDefault();

  // NOTE: Renamed the `filename` to `nodeName` and `nodeName` to `nodeNameElement`
  const nodeName = nodeNameElement.value;
  const buffer = audio.recordingBuffer;

  socket.emit("upload_audio", { buffer, name: nodeNameElement.value });
  socket.emit("uploaded-node", nodeName);
  console.log("sending", nodeName);
  nodeNameElement.value = "";

  console.log("audio sent to server! thank you :3");
  console.log("input cleared");
  nodeNameElement.disabled = true;
}
function disposeRecBuffer() {
  audio.recordingBuffer = [];
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
  if (audio.recorder.state !== "started") {
    startRecord(e);
  } else {
    stopRecord(e);
  }
}

function startRecord(e) {
  // findTarget //
  setRecordingStyle();
  audio.mic.connect(audio.waveform);
  audio.mic.mute = false;
  audio.recorder.start();
  e.innerHTML = "5";
  startTimer();
}

async function stopRecord() {
  audio.mic.mute = true;
  uploadBtn.disabled = true;
  removeRecordingStyle();
  clearTimeout(recTimer);
  stopTimer();
  recBtn.innerHTML = "";
  nodeNameElement.removeAttribute("disabled");
  await audio.stopRecord();
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
  if (recTimeCounter > 0) {
    recBtn.innerHTML = `${recTimeCounter}`;
    recTimeCounter--;
  } else {
    stopTimer();
  }
}

// RECORDING TIMER
function startTimer() {
  count();
  countInterval = setInterval(count, 1000);
  recTimer = window.setTimeout(stopRecord, REC_MAX_TIME);
}

function stopTimer() {
  clearInterval(countInterval);
  recBtn.innerHTML = "";
  recTimeCounter = REC_MAX_TIME_SECS;
}

// ON INPUT => MAKE uploadBtn AVAILABLE
/**
 *
 */
function enableUploadButtonIf() {
  const val = nodeNameElement.value.trim();
  if (val && audio.recorder.state !== "started") {
    uploadBtn.removeAttribute("disabled");
    return;
  }
  uploadBtn.disabled = true;
  return;
}

// PLAY RECORDED AUDIO + UI
function cueBtnClick() {
  if (audio.player.state !== "started") {
    audioPlayerElement.play();
    audio.player.start();
    audio.player.connect(audio.waveform);
    cueBtn.classList.add("playing");
  } else {
    audio.player.stop();
    cueBtn.classList.remove("playing");
  }
}
