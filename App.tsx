/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import AsyncStorage from '@react-native-community/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {
  Button,
  Image,
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Camera, PhotoFile} from 'react-native-vision-camera';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import broadcastSpeed2 from './src/broadcaster/firestore_broadcaster';
import getCameraConfiguration, {
  CameraConfig,
} from './src/camera/get_camera_configuration';
import getPermissions from './src/camera/get_permissions';
import MyCamera, {
  imageHeight,
  imageResizeFactor,
  imageWidth,
} from './src/camera/my_camera';
import CalibrationPanel from './src/controls/calibration_panel';
import ControlPanel from './src/controls/control_panel';
import StatusBox from './src/status/status_box';

const fps = 60;
const App = () => {
  const [
    cameraConfiguration,
    setCameraConfiguration,
  ] = useState<CameraConfig>();

  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    getPermissions(setPermissionGranted);
    getCameraConfiguration(setCameraConfiguration);

    const nativeEventEmitter = new NativeEventEmitter(
      NativeModules.MyEventEmitter,
    );
    nativeEventEmitter.addListener('image-available', (imageUrl) => {
      setPhotoUri(imageUrl);
    });

    console.log('We are now listening to image-available');
  }, []);
  const [status, setStatus] = useState('initialized');

  const onPressLearnMore = () => {
    console.log('this is just a log 3');
    if (status == 'failing') {
      setStatus('succeeding');
    } else {
      setStatus('failing');
    }
  };

  const broadcastSpeed = () => {
    broadcastSpeed2(5);
  };

  const [photoUri, setPhotoUri] = useState('');
  const [selectedVideoUri, setVideoUri] = useState('');

  const cameraRef = useRef<Camera>(null);
  const takePicture = () => {
    cameraRef.current
      ?.takePhoto()
      .then((snapshot: PhotoFile) => {
        console.log('got photo', snapshot.width, snapshot.height);
        console.log('orientation', snapshot.metadata.Orientation);
        console.log(
          'exif pixelDimensions',
          snapshot.metadata['{Exif}'].PixelXDimension,
          snapshot.metadata['{Exif}'].PixelYDimension,
        );
        setPhotoUri(snapshot.path);
      })
      .catch((e) => {
        console.log('error', e);
      });
  };

  const callSwiftWithSimulatorVideo = () => {
    console.log('calling swift');
    NativeModules.Bulb.turnOn();
    NativeModules.ImageProcessor.process(
      'file:///Users/aris/Library/Developer/CoreSimulator/Devices/D5565BBE-48DA-4821-9086-EE9D54432BA4/data/Media/DCIM/100APPLE/IMG_0007.MOV',
    );
  };

  const callSwiftWithSelectedVideo = () => {
    console.log('calling swift');
    NativeModules.ImageProcessor.process(selectedVideoUri);
  };

  const [showCalibrationPanel, setShowCalibrationPanel] = useState(false);
  const clickedCalibrate = () => {
    if (!showCalibrationPanel) {
      takePicture();
    }
    setShowCalibrationPanel(!showCalibrationPanel);
  };

  const [isRecording, setIsRecording] = useState(false);
  const clickedRecord = () => {
    recordVideo();
    setIsRecording(true);
  };

  const clickedStop = () => {
    stopVideoRecording();
    setIsRecording(false);
  };

  const analyze = (uri: string, duration: number) => {
    AsyncStorage.multiGet(
      ['boundsX1', 'boundsY1', 'boundsX2', 'boundsY2'],
      (errors, results) => {
        console.log('Any errors during AsyncStorage.multiGet: ', errors);
        if (results == null) {
          return;
        }
        const boundsX1 = Number(results[0][1]) / imageResizeFactor;
        const boundsY1 = Number(results[1][1]) / imageResizeFactor;
        const boundsX2 = Number(results[2][1]) / imageResizeFactor;
        const boundsY2 = Number(results[3][1]) / imageResizeFactor;

        console.log('bounds', boundsX1, boundsY1, boundsX2, boundsY2);

        NativeModules.ImageProcessor.process(
          uri,
          fps,
          duration,
          boundsX1,
          boundsY1,
          boundsX2,
          boundsY2,
        );
      },
    );
  };

  const [lastVideoDetails, setLastVideoDetails] = useState<VideoDetails>({
    uri: '',
    duration: 0,
  });

  type VideoDetails = {
    uri: string;
    duration: number;
  };

  const recordVideo = () => {
    cameraRef.current?.startRecording({
      onRecordingFinished: (video) => {
        console.log('Got video:', video);
        var path = video.path;
        setLastVideoDetails({
          uri: video.path,
          duration: video.duration,
        });
        analyze(video.path, video.duration);
      },
      onRecordingError: (error) => console.error('Error recording:', error),
    });
  };

  const stopVideoRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const rerunAnalysis = () => {
    analyze(lastVideoDetails.uri, lastVideoDetails.duration);
  };

  // if (cameraConfiguration == undefined) {
  //   console.log('camera config not ready');
  // } else {
  //   console.log('camera config ready');
  // }

  // if (permissionGranted) {
  //   console.log('Permission is all set');
  // } else {
  //   console.log('Permission not yet set');
  // }

  const showCamera = cameraConfiguration != undefined && permissionGranted;

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
            <StatusBox status={status}></StatusBox>

            <View style={styles.cameraHolderOuter}>
              <View style={styles.cameraHolderInner}>
                <MyCamera
                  showCamera={showCamera}
                  cameraConfig={cameraConfiguration as CameraConfig}
                  cameraRef={cameraRef}
                  fps={fps}></MyCamera>
              </View>
            </View>

            <View style={styles.controlPanelHolder}>
              <ControlPanel
                onPressCalibrate={clickedCalibrate}
                onPressRecord={clickedRecord}
                onPressStop={clickedStop}
                isRecording={isRecording}
              />
            </View>

            <View style={styles.centerContent}>
              <CalibrationPanel
                showPanel={showCalibrationPanel}
                photoUri={photoUri}></CalibrationPanel>
            </View>

            <Text>Video Analysis</Text>

            <View style={styles.centerContent}>
              <Image
                source={{uri: photoUri}}
                style={{
                  width: imageWidth,
                  height: imageHeight,
                  borderColor: 'red',
                }}
                resizeMode={'contain'}
              />
            </View>

            <View style={styles.sectionContainer}>
              <Button
                onPress={rerunAnalysis}
                title="Rerun Last Analysis"
                color="#841584"
              />

              <Button
                onPress={callSwiftWithSimulatorVideo}
                title="Call swift (Simulator Videos)"
                color="#841584"
              />

              <Button
                onPress={callSwiftWithSelectedVideo}
                title="Call swift (Selected Video)"
                color="#841584"
              />

              <Button
                onPress={takePicture}
                title="Take snapshot"
                color="#841584"
              />

              <Button
                onPress={onPressLearnMore}
                title="Toggle Status"
                color="#841584"
              />

              <Button
                onPress={broadcastSpeed}
                title="Broadcast Speed"
                color="#158484"
              />

              <View
                style={{
                  width: '100%',
                  height: 500,
                }}></View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    //backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.aliceblue,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  centerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cameraHolderOuter: {
    position: 'relative',
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cameraHolderInner: {
    position: 'absolute',
  },
  controlPanelHolder: {
    position: 'relative',
    zIndex: 1,
    paddingTop: 280,
    transform: [{translateX: 20}],
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
