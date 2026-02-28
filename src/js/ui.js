/*
 * - manipulates form-data: (login, node-name, audio-fetch)
 * - manipulates UI-elements styles: (login, rec, cue, input, upload)
 * - creates countdown-timer: recording max duration
 * - sets Tone.js: recorder & player
 */
// want to add audio FX : PANNING(X-COORD) - PLAYBACK-SPEED(VELOCITY) - VOLUME(Z-COORD) -
import * as Tone from "tone";
import { initSocket, joinDatabase, getSocket } from "./socket.js";
import {
  audio,
  inputID,
  editBtn,
  uploadBtn,
  loginBtn,
  nodeNameElement,
  recBtn,
  cueBtn
} from "./main.js";

// state
const REC_MAX_TIME_SECS = 5;
const REC_MAX_TIME = REC_MAX_TIME_SECS * 1000;
let recTimer, countInterval;
let recTimeCounter = 5;
let userData = {
  username: "home",  // Start as home
};

// function inputClick() {
//   loginBtn.removeAttribute("disabled");
// }

// Module-level socket reference for callbacks
let localSocket = null;

export function initUi() {
  // Enable all UI immediately - user is already in "home" space
  recBtn.disabled = !Tone.UserMedia.supported;
  cueBtn.disabled = true;  // Disabled until recording exists
  loginBtn.disabled = false;  // Enabled - acts as "switch space"
  uploadBtn.disabled = true;
  nodeNameElement.disabled = true;
  
  // Pre-fill username with "home"
  inputID.value = "home";

  // events
  window.addEventListener("click", audio.start, { once: true });
  window.addEventListener("keydown", audio.start, { once: true });

  loginBtn.addEventListener("click", loginBtnClick);
  editBtn.addEventListener("click", editBtnClick);
  // inputID.addEventListener("input", inputClick); // REMOVED DISABLING AT INIT. 
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
  audio.player.onstop = audioPlayerOnEndedCallback;
  
  // Store reference to socket from main
  // localSocket = socket;
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

function loginBtnClick(e) {
    // validation 
  let isFormValid = inputID.checkValidity();
  if (!isFormValid) {
    inputID.reportValidity();
  } else {
    e.preventDefault();
    
    const newUsername = inputID.value.trim();
    
    // If "home", just refresh the current database
    if (newUsername === "home") {
      // console.log("Refreshing home database");
      joinDatabase("home");
      userData.username = "home";
      // UI stays enabled, just refresh
      return;
    }
    
    // For new username: switch to personal space
    inputID.disabled = true;
    recBtn.removeAttribute("disabled");
    loginBtn.style.display = "none";
    editBtn.style.display = "flex";
    userData.username = newUsername;
    
    // console.log("Switching to personal space:", newUsername);
    
    // Join new database (creates empty if new user)
    joinDatabase(newUsername);
    localSocket = socket;  // Update reference
  }
}

function editBtnClick(e) {
  e.preventDefault();
  inputID.removeAttribute("disabled");
  loginBtn.style.display = "flex";
  editBtn.style.display = "none";
  
  // Reset to home when editing
  inputID.value = "home";
}

async function uploadBtnCallback(e) {
  e.preventDefault();

  const nodeName = nodeNameElement.value.trim();
  if (!nodeName) return;
  
  const buffer = audio.recordingBuffer;
  const username = userData.username || 'home';
  const currentSocket = getSocket();
  if (!currentSocket) {
    console.error("Socket not available");
    return;
  }
  
  currentSocket.emit("upload_audio", { buffer, name: nodeName, username });
  currentSocket.emit("uploaded-node", { nodeName, username });
  
  console.log("sending", nodeName, "for user", username);
  nodeNameElement.value = "";
  console.log("audio sent to server! thank you :3");
  nodeNameElement.disabled = true;
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
  if (audio.player.state !== "started") {
    audio.player.start();
    audio.player.connect(audio.waveform);
    cueBtn.classList.add("playing");
  } else {
    audio.player.stop();
    cueBtn.classList.remove("playing");
  }
}