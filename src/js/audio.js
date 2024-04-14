import * as Tone from "tone";

export class Audio {
  actx;
  dest;
  recorder;
  mic;
  player;
  waveform;
  recorder;
  currentObjectURL = null;

  // Create an array to store the audio
  recordingBuffer = [];

  constructor(audioPlayerElement) {
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
  async stopRecord() {
    if (this.currentObjectURL) {
      URL.revokeObjectURL(this.currentObjectURL);
    }
    const recording = await this.recorder.stop();

    const bufferURL = URL.createObjectURL(recording);

    this.audioPlayerElement.src = bufferURL;
    this.setPlayerURL(bufferURL);
    this.addToBuffer(recording);
    
    this.resetMic()
    this.currentObjectURL = bufferURL;
  }

  setPlayerURL(url) {
    this.player.load(url);
  }

  resetMic() {
    this.mic.disconnect();
    this.mic.connect(this.dest);
  }
}
