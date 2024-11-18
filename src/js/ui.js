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
  audio.recPlayer.onstop = audioPlayerOnEndedCallback;
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
  recBtn.style.backgroundImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAKJSURBVHgB1VqNmYIwDI1OwAhsIBscG5wbyAa6gWzijXA3Ad4E6gTqBLhBrpWgoQSOnwLlfZdPLC0mzUtKm1uABSCApz7WSlZKfCUBZG0e63YjOSu5KDkusu/TQCutZK8kUYId5aQkwszoccAUT3soLslhcENqFE/JEzsla60IMvqQ0YGSUEmM9V7bg22QQifhx3KlvQ7P9Ig+0nOv1ryhHrQRZl0rHoIlkGeuglfX0AdEGfOhOxgI5M3UCqUE5e25tf53fcEb7YygQDTTXWued0VFzG3aDE6nUp7p4RlGpI0YYLhvFNrU6OIZ+pz+G7BvbfHAEBgR13XknBss27QFZSc+sZ7U6cCpA44Bi6t3bN40Zz8Ex0CLnewFWtKbBcqEqPSCka4icBRGLCR5o0mf0XN+U1Ba5RnJW0KR73qX9ABHQbqdWdNaGxCwhl9wHz/sOtAGrFjDEdzHjV372gCfNThLHwZOoRXMJYBzUCC/1oMFPtsyLJ5/7oPrvISZQxvw4v1cKMS/FwyAGRgAxaRz0wbwqA7AfRSOK7UBd9bgg/sI2fXF9MAnuI8Pdn0u5dUZvMzxdcvPbyQubiVNVO5bMDtwLb5nO4jKfYvwnh2CYzC2lG/6sA5OewGL50MHqYPpBZeOVba1s886xjjXgy02gAfKdcq0iuWT6mvTQfM93KXBkcG505h0EpTX0q5aY8TD1AWOGLpAMGLoEtMWyyWmGPoAs2pNKngjBEugRSoRJisCG6hwax4bEXYvs+5QrhkPE3MCpbgkdF/PZoDlQrdP3syVriqYxzAkSJGvGkO6SErGj5euyZAI5Up7U0n6Km7lHIj4GkK2p87/5cZnXR7wPpi90+e3jYPkP2UbPJU9GZp5AAAAAElFTkSuQmCC)";
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
  if (audio.recPlayer.state !== "started") {
    audio.recPlayer.start();
    audio.recPlayer.connect(audio.waveform);
    cueBtn.classList.add("playing");
  } else {
    audio.recPlayer.stop();
    cueBtn.classList.remove("playing");
  }
}