import React, {SetStateAction} from 'react';
import {
  Camera,
  CameraDevice,
  CameraDeviceFormat,
  parsePhysicalDeviceTypes,
} from 'react-native-vision-camera';

export type CameraConfig = {
  camera: CameraDevice;
  format: CameraDeviceFormat;
};

export default async function getCameraConfiguration(
  setCameraConfiguration: React.Dispatch<
    SetStateAction<CameraConfig | undefined>
  >,
): Promise<void> {
  const devices = await Camera.getAvailableCameraDevices();

  let selectedDevice;
  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    if (device.name == 'Back Camera') {
      selectedDevice = device;
    }
    console.log(
      'DEVICE #' + i + ', Name: ' + device.name,
      device.id,
      device.devices,
      parsePhysicalDeviceTypes(device.devices),
    );
  }

  if (!selectedDevice) {
    return;
  }

  var selectedFormat;
  for (let i = 0; i < selectedDevice.formats.length; i++) {
    const format = selectedDevice.formats[i];
    const frameRate = format.frameRateRanges[0];
    if (
      frameRate.maxFrameRate != 240 ||
      format.videoWidth != 1280 ||
      format.videoHeight != 720 ||
      format.colorSpaces.length != 1
    ) {
      continue;
    }
    console.log(
      'Format:',
      format.videoWidth,
      format.videoHeight,
      frameRate.maxFrameRate,
    );
    selectedFormat = format;
    console.log(format);
  }

  if (!selectedFormat) {
    return;
  }

  const config = {
    camera: selectedDevice,
    format: selectedFormat,
  };
  setCameraConfiguration(config);
}
