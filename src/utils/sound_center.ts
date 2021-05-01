import Sound from 'react-native-sound';
import sleep from './sleep';

var countdownBeep: Sound;
var startBeep: Sound;
var doneBeep: Sound;

export function initializeSounds() {
  Sound.setCategory('Playback');

  countdownBeep = loadSound('countdown_beep.wav');
  startBeep = loadSound('start_beep2.wav');
  startBeep.setVolume(0.7);
  doneBeep = loadSound('done_beep.wav');
  doneBeep.setVolume(5);
}

export async function playStartSound(isRecordingRef: React.RefObject<boolean>) {
  for (var i = 0; i < 3; i++) {
    if (!isRecordingRef?.current) return;
    await playSound(countdownBeep);
    await sleep(500);
  }
  await playSound(startBeep);
}

export async function playStopSound() {
  await playSound(doneBeep);
}

function loadSound(filename: string): Sound {
  return new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
    if (error) {
      console.log('Failed to load sound file: ', filename);
    }
  });
}

async function playSound(sound: Sound): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    sound.play((success) => {
      if (success) {
        resolve();
      } else {
        reject();
      }
    });
  });
}
