import React from 'react';
import RNBeep from 'react-native-a-beep';
import sleep from './sleep';

export default async function playStartSound(
  isRecordingRef: React.RefObject<boolean>,
): Promise<void> {
  for (var i = 0; i < 3; i++) {
    if (!isRecordingRef?.current) return;
    RNBeep.PlaySysSound(1110);
    await sleep(1000);
  }
  if (!isRecordingRef?.current) return;
  await RNBeep.PlaySysSound(1111);
}
