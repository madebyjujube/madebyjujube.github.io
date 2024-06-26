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

  recordingBuffer = [];

  constructor() {
    Tone.Master.volume.value = 0;

    this.actx = Tone.context;
    this.dest = this.actx.createMediaStreamDestination();

    this.panner = new Tone.Panner().toDestination();
    this.recorder = new Tone.Recorder();
    this.waveform = new Tone.Waveform();
    this.player = new Tone.Player().toDestination();
    this.nodePlayer = new Tone.Player().connect(this.panner).toDestination();

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

  // // PANNER IMPLEMENTATION iN PROGRESS (see onNodeClick)
  // panNode() {
  //   window.addEventListener("mousemove", (e) => {
  //     let mousex = e.clientX;
  //     let normalx = (mousex / window.innerWidth) * 2 - 1;
  //     let x = Math.min(Math.max(normalx, -1), 1)
  //     this.panner.pan.rampTo(x, 0.5);
  //   });
  // }

  //   MIC INIT
  initMic() {
    return mic;
  }

  addToBuffer(data) {
    this.recordingBuffer.pop(); // erase previous chunk
    this.recordingBuffer.push(data);
  }

  /**
   * awaiting recorder stop:
   */
  async stopRecord() {
    const recording = await this.recorder.stop();
    if (this.currentObjectURL) {
      URL.revokeObjectURL(this.currentObjectURL);
    }

    const bufferURL = URL.createObjectURL(recording);
    this.setPlayerURL(bufferURL);
    this.currentObjectURL = bufferURL;

    this.addToBuffer(recording);
  }

  setPlayerURL(url) {
    this.player.load(url);
  }

  /**
   * @param {*} node 
   * @returns {} bufferURL
   */
  async fetchAudioFile(node) {
    const reslut = await fetch(`/audio/${node.id}.wav`)
    const blob = await reslut.blob()
    const bufferURL = URL.createObjectURL(blob);
    return bufferURL
  }

  async trigNodeSound(node) {
    let bufferURL = await this.fetchAudioFile(node)
    await this.nodePlayer.load(bufferURL)
    this.nodePlayer.start()
  }
}
