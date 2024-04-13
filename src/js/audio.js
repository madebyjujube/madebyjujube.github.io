import * as Tone from "tone";

export class Audio {
  actx;
  dest;
  recorder;
  mic;
  player;
  waveform;

  // Create an array to store the audio
  recordingBuffer = [];

  constructor() {
    Tone.Master.volume.value = 0;

    this.actx = Tone.context;
    this.dest = this.actx.createMediaStreamDestination();

    this.mic = this.initMic();
    this.waveform = new Tone.Waveform();

    this.player = new Tone.Player().toDestination();
    // this.player.onstop = audioPlayerOnEndedCallback;
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
    const mic = new Tone.UserMedia();
    mic.open();
    mic.connect(this.dest);

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
