/*
 * -manipulates login
 * - manips UI elements
 *    sets toneejs recorder & player
 *    has node name input
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
  nodeName,
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

  // console.log({ recorder });

  // POPULATE BUFFER: chunks[]
  // audio.recorder.ondataavailable = recorderOnDataCallback;

  // audio.recorder.onstop = recorderOnStopCallback;

  audioPlayerElement.onended = audioPlayerOnEndedCallback;
}

function audioPlayerOnEndedCallback() {
  cueBtn.classList.remove("playing");
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
  if (audio.recorder.state !== "started") {
    startRecord(e);
    console.log("recording...");
  } else {
    stopRecord(e);
    console.log("stopping...");
  }
}

function startRecord(e) {
  // findTarget //
  setRecordingStyle();
  audio.mic.connect(audio.waveform);
  audio.recorder.start();
  // recording = true;
  e.innerHTML = "5";
  startTimer();
}

async function stopRecord() {
  uploadBtn.disabled = true;
  removeRecordingStyle();
  clearTimeout(recTimer);
  stopTimer();
  recBtn.innerHTML = "";

  audio.resetMic();
  const recording = await audio.recorder.stop();
  const bufferURL = URL.createObjectURL(recording);
  audioPlayerElement.src = bufferURL;
  audio.setPlayerURL(bufferURL);

  nodeName.removeAttribute("disabled");
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
  const val = nodeName.value.trim();
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

