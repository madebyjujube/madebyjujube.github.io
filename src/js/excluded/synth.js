// setup audiokeys from audiokeys.min.js
const keyboard = new AudioKeys();

// create synth
const synth = new Tone.Synth().toMaster();
synth.connect(dest);

// create a delay
const feedbackDelay = new Tone.FeedbackDelay({
    delayTime: 0.5, 
    feedback: 0.5,
    wet: 0.5
}).toDestination();

// connect the synth to the delay
synth.connect(feedbackDelay);

keyboard.down((key) => {
    if (actx.state !== "running") {
        Tone.start();
    }

    synth.triggerAttackRelease(key.frequency, "8n");
});




