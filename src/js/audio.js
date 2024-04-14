import * as Tone from "tone";
import {
  audioPlayerElement,
} from "./main.js";
export class Audio {
  actx;
  dest;
  recorder;
  mic;
  player;
  waveform;
  recorder;
  currentObjectURL = null;

  recordingBuffer = [];

  constructor() {
    Tone.Master.volume.value = 0;

    this.actx = Tone.context;
    this.dest = this.actx.createMediaStreamDestination();
    
    this.audioPlayerElement = audioPlayerElement;
    this.recorder = new Tone.Recorder();
    this.waveform = new Tone.Waveform();
    this.player = new Tone.Player().toDestination();

    this.mic = new Tone.UserMedia();
    this.mic.open();
    this.mic.connect(this.recorder);
    this.rectime = 1;
  }

  start() {
    if (Tone.context.state !== "running") Tone.start();
  }

  /*
   * START/STOP RECORDER (first UI event)
   * @returns
   */
  initAudio() {
    return {
      initialized: true,
      mic,
    };
  }

  //   MIC INIT
  initMic() {
    return mic;
  }

  addToBuffer(data) {
    this.recordingBuffer.pop(); // erase previous chunk
    this.recordingBuffer.push(data);
  }

  /**
   * function of the Audio class called when recording has stopped
   * - awaiting recorder stop:
   * - creates a URL with the recorded data
   * - populate the HTML audio element (html element has useful onend event for later)
   * - adds the audio to the recording buffer
   * 
   * !! issue: Uncaught (in promise): when recording stopped more than once.
   */
  async stopRecord() {
    const recording = await this.recorder.stop();
    console.log(recording);
    if (this.currentObjectURL) {
      URL.revokeObjectURL(this.currentObjectURL);
    }
  
    const bufferURL = URL.createObjectURL(recording);
    this.player.load(bufferURL); // Load audio data first
    this.currentObjectURL = bufferURL;
  
    this.addToBuffer(recording);
    this.resetMic();
  }
  
  setPlayerURL(url) {
    this.player.load(url);
  }

  resetMic() {
    this.mic.disconnect();
    this.mic.connect(this.dest);
  }
}
