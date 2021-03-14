import React, {SetStateAction} from 'react';
import {Camera} from 'react-native-vision-camera';

export default async function getPermissions(
  setPermissionGranted: React.Dispatch<SetStateAction<boolean>>,
): Promise<void> {
  const cameraPermission = await Camera.getCameraPermissionStatus();
  const microphonePermission = await Camera.getMicrophonePermissionStatus();

  if (cameraPermission == 'authorized') {
    console.log('Camera already authorized');
  }

  if (microphonePermission == 'authorized') {
    console.log('Microphone already authorized');
  }

  if (
    cameraPermission == 'authorized' &&
    microphonePermission == 'authorized'
  ) {
    setPermissionGranted(true);
    return;
  }

  const newCameraPermission = await Camera.requestCameraPermission();
  const newMicrophonePermission = await Camera.requestMicrophonePermission();

  console.log('new camera permission', newCameraPermission);
  console.log('new microphone permission', newMicrophonePermission);

  if (
    cameraPermission == 'authorized' &&
    microphonePermission == 'authorized'
  ) {
    setPermissionGranted(true);
  }
}
