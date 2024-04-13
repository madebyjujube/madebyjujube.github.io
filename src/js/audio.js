import * as Tone from "tone";

export class Audio {
  actx;
  dest;
  recorder;
  mic;
  player;
  waveform;
  recorder;

  // Create an array to store the audio
  recordingBuffer = [];

  constructor() {
    Tone.Master.volume.value = 0;

    this.actx = Tone.context;
    this.dest = this.actx.createMediaStreamDestination();

    this.recorder = new Tone.Recorder();

    this.mic = new Tone.UserMedia();
    this.mic.open();
    this.mic.connect(this.recorder);

    this.waveform = new Tone.Waveform();

    this.player = new Tone.Player().toDestination();
    // this.player.onstop = audioPlayerOnEndedCallback;
    //
    // this.recorder = new MediaRecorder(this.dest.stream);
    // this.recorder.ondataavailable = (e) => this.addToBuffer(e.data);
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

  setPlayerURL(url) {
    // async function call
    this.player.load(url);
  }

  resetMic() {
    this.mic.disconnect();
    this.mic.connect(this.dest);
  }
}
