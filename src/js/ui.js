import * as Tone from "tone";
import { getSocket, joinDatabase } from "./socket.js";
import {
  audio, inputID, editBtn, uploadBtn, loginBtn,
  nodeNameElement, recBtn, cueBtn
} from "./main.js";

const REC_MAX_TIME_SECS = 5;
const REC_MAX_TIME = REC_MAX_TIME_SECS * 1000;
let recTimer, countInterval;
let recTimeCounter = 5;
let userData = { username: "home" };

export function initUi() {
  // Enable UI
  recBtn.disabled = !Tone.UserMedia.supported;
  cueBtn.disabled = true;
  loginBtn.disabled = false;
  uploadBtn.disabled = true;
  nodeNameElement.disabled = true;
  inputID.value = "home";

  // Events
  window.addEventListener("click", audio.start, { once: true });
  window.addEventListener("keydown", audio.start, { once: true });

  loginBtn.addEventListener("click", loginBtnClick);
  editBtn.addEventListener("click", editBtnClick);
  recBtn.addEventListener("click", startStopRec);
  cueBtn.addEventListener("click", cueBtnClick);
  nodeNameElement.addEventListener("input", enableUploadButtonIf);
  uploadBtn.addEventListener("click", uploadBtnCallback);
  audio.player.onstop = () => cueBtn.classList.remove("playing");
}

function loginBtnClick(e) {
  if (!inputID.checkValidity()) {
    inputID.reportValidity();
    return;
  }
  
  e.preventDefault();
  const newUsername = inputID.value.trim();
  
  if (newUsername === "home") {
    joinDatabase("home");
    userData.username = "home";
    return;
  }
  
  // Switch to personal space
  inputID.disabled = true;
  recBtn.removeAttribute("disabled");
  loginBtn.style.display = "none";
  editBtn.style.display = "flex";
  userData.username = newUsername;
  
  joinDatabase(newUsername);
}

function editBtnClick(e) {
  e.preventDefault();
  inputID.removeAttribute("disabled");
  loginBtn.style.display = "flex";
  editBtn.style.display = "none";
  inputID.value = "home";
}
function showNameError(message) {
  nodeNameElement.classList.add('input-error');
  nodeNameElement.placeholder = message;
  nodeNameElement.value = "";
  
  // Remove error style after 3 seconds
  setTimeout(() => {
    nodeNameElement.classList.remove('input-error');
    nodeNameElement.placeholder = "enter node name"; // your original placeholder
  }, 3000);
}
// Replace slashes and other filesystem/URL problematic characters
function sanitizeNodeName(name) {
  return name
    .replace(/[\/\\]/g, '-')  // Replace / and \ with -
    .replace(/["|?*,]/g, '') // Remove other illegal chars
    .trim();
}

async function uploadBtnCallback(e) {
  e.preventDefault();

  let nodeName = nodeNameElement.value.trim();
  if (!nodeName) return;
  
  // Sanitize the name
  nodeName = sanitizeNodeName(nodeName);
  if (!nodeName) {
    showNameError("Invalid name - try again");
    return; // Upload blocked
  }
  // Optional: Alert user if name was changed
  if (nodeName !== nodeNameElement.value.trim()) {
    console.log(`Name sanitized to: ${nodeName}`);
  }
  
  const buffer = audio.recordingBuffer;
  const username = userData.username || 'home';
  const currentSocket = getSocket();
  
  if (!currentSocket) {
    console.error("Socket not available");
    return;
  }
  
  currentSocket.emit("upload_audio", { buffer, name: nodeName, username });
  currentSocket.emit("uploaded-node", { nodeName, username });
  
  nodeNameElement.value = "";
  nodeNameElement.disabled = true;
  disposeRecBuffer();
}

function startStopRec(e) {
  if (audio.recorder.state !== "started") {
    startRecord(e);
  } else {
    stopRecord(e);
  }
}

function startRecord(e) {
  setRecordingStyle();
  audio.mic.connect(audio.waveform);
  audio.mic.mute = false;
  audio.recorder.start();
  e.target.innerHTML = "5";
  startTimer();
}

async function stopRecord(e) {
  audio.mic.mute = true;
  uploadBtn.disabled = true;
  removeRecordingStyle();
  clearTimeout(recTimer);
  stopTimer();
  recBtn.innerHTML = "";
  nodeNameElement.removeAttribute("disabled");
  await audio.stopRecord();
}

function setRecordingStyle() {
  recBtn.classList.add("recording");
  cueBtn.setAttribute("disabled", "1");
}

function removeRecordingStyle() {
  recBtn.classList.remove("recording");
  recBtn.style.backgroundImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAKJSURBVHgB1VqNmYIwDI1OwAhsIBscG5wbyAa6gWzijXA3Ad4E6gTqBLhBrpWgoQSOnwLlfZdPLC0mzUtKm1uABSCApz7WSlZKfCUBZG0e63YjOSu5KDkusu/TQCutZK8kUYId5aQkwszoccAUT3soLslhcENqFE/JEzsla60IMvqQ0YGSUEmM9V7bg22QQifhx3KlvQ7P9Ig+0nOv1ryhHrQRZl0rHoIlkGeuglfX0AdEGfOhOxgI5M3UCqUE5e25tf53fcEb7YygQDTTXWued0VFzG3aDE6nUp7p4RlGpI0YYLhvFNrU6OIZ+pz+G7BvbfHAEBgR13XknBss27QFZSc+sZ7U6cCpA44Bi6t3bN40Zz8Ex0CLnewFWtKbBcqEqPSCka4icBRGLCR5o0mf0XN+U1Ba5RnJW0KR73qX9ABHQbqdWdNaGxCwhl9wHz/sOtAGrFjDEdzHjV372gCfNThLHwZOoRXMJYBzUCC/1oMFPtsyLJ5/7oPrvISZQxvw4v1cKMS/FwyAGRgAxaRz0wbwqA7AfRSOK7UBd9bgg/sI2fXF9MAnuI8Pdn0u5dUZvMzxdcvPbyQubiVNVO5bMDtwLb5nO4jKfYvwnh2CYzC2lG/6sA5OewGL50MHqYPpBZeOVba1s886xjjXgy02gAfKdcq0iuWT6mvTQfM93KXBkcG505h0EpTX0q5aY8TD1AWOGLpAMGLoEtMWyyWmGPoAs2pNKngjBEugRSoRJisCG6hwax4bEXYvs+5QrhkPE3MCpbgkdF/PZoDlQrdP3syVriqYxzAkSJGvGkO6SErGj5euyZAI5Up7U0n6Km7lHIj4GkK2p87/5cZnXR7wPpi90+e3jYPkP2UbPJU9GZp5AAAAAElFTkSuQmCC)";
  cueBtn.removeAttribute("disabled");
}

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

function count() {
  if (recTimeCounter > 0) {
    recBtn.innerHTML = `${recTimeCounter}`;
    recTimeCounter--;
  } else {
    stopTimer();
  }
}

function enableUploadButtonIf() {
  const val = nodeNameElement.value.trim();
  uploadBtn.disabled = !(val && audio.recorder.state !== "started");
}

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

function disposeRecBuffer() {
  audio.recordingBuffer = [];
}

function audioPlayerOnEndedCallback() {
  cueBtn.classList.remove("playing");
}