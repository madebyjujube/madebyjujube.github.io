import * as Tone from "tone";

/*
 * START/STOP RECORDER (first UI event)
 * @returns
 */
export function initAudio() {
  if (Tone.context.state !== "running") Tone.start();
  return true;
}
