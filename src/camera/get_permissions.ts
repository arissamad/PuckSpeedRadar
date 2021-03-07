import {Camera} from 'react-native-vision-camera';

export default async function getPermissions(): Promise<void> {
  const cameraPermission = await Camera.getCameraPermissionStatus();
  const microphonePermission = await Camera.getMicrophonePermissionStatus();

  console.log('camera permission', cameraPermission);
  console.log('microphone permission', microphonePermission);
}
