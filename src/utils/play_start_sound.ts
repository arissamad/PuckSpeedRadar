import RNBeep from 'react-native-a-beep';
import sleep from './sleep';

export default async function playStartSound(): Promise<void> {
  for (var i = 0; i < 3; i++) {
    RNBeep.PlaySysSound(1103);
    await sleep(1000);
  }
  await RNBeep.PlaySysSound(1117);
}
