import React, {RefObject} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {CameraConfig} from './get_camera_configuration';

type Props = {
  showCamera: boolean;
  cameraConfig: CameraConfig;
  cameraRef: RefObject<Camera>;
  fps: number;
};

export default function MyCamera(props: Props): React.ReactElement {
  const {cameraConfig} = props;
  if (!props.showCamera) {
    return (
      <View style={styles.noCameraView}>
        <Text style={styles.noCameraText}>{'Camera is not available'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraView}>
      <Text style={styles.cameraText}>{'camera below'}</Text>
      <Camera
        ref={props.cameraRef}
        style={StyleSheet.absoluteFill}
        device={cameraConfig.camera}
        format={cameraConfig.format}
        fps={props.fps}
        isActive={true}
      />
    </View>
  );
}

// Given the video size, this is the factor to convert it to React dimensions for display on the phone
export const imageResizeFactor = 0.5;

export const imageWidth = 1280 * imageResizeFactor;
export const imageHeight = 720 * imageResizeFactor;

const translateX = imageWidth / 2 - imageHeight / 2;

const styles = StyleSheet.create({
  noCameraView: {
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'pink',
    padding: 10,
  },

  noCameraText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'red',
  },

  cameraView: {
    position: 'relative',
    backgroundColor: 'grey',
    width: imageWidth,
    height: imageHeight,
    borderColor: '#ff0000',
    borderWidth: 3,
    padding: 5,
  },

  cameraText: {
    textAlign: 'center',
  },

  camera: {},
});
