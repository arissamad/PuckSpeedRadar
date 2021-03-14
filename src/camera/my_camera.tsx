import React, {RefObject} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {CameraConfig} from './get_camera_configuration';

type Props = {
  showCamera: boolean;
  cameraConfig: CameraConfig;
  cameraRef: RefObject<Camera>;
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
        fps={30}
        isActive={true}
      />
    </View>
  );
}

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
    backgroundColor: 'grey',
    paddingTop: 10,
    paddingBottom: 10,
    width: 720 / 4,
    height: 1280 / 4,
  },

  cameraText: {
    textAlign: 'center',
  },

  camera: {},
});
