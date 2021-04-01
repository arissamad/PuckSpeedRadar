import RNBeep from 'react-native-a-beep';

export default async function playEndSound(): Promise<void> {
  RNBeep.PlaySysSound(1109);
}
