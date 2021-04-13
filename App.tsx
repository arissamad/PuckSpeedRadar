/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

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
  ViewStyle,
} from 'react-native';
import RNFS from 'react-native-fs';
import {Camera, PhotoFile} from 'react-native-vision-camera';
import {Colors} from 'react-native/Libraries/NewAppScreen';
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
import getCalibrationInfo from './src/controls/get_calibration_info';
import {
  deleteVideos,
  initializeDatabase,
  selectVideos,
} from './src/history/database';
import moveAndSaveFile from './src/history/move_and_save_file';
import ShotHistory from './src/history/shot_history';
import VideoDetails from './src/history/video_details';
import StatusBox from './src/status/status_box';
import playEndSound from './src/utils/play_end_sound';
import playErrorSound from './src/utils/play_error_sound';
import playStartSound from './src/utils/play_start_sound';
import sleep from './src/utils/sleep';

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

    const imageAvailableEventEmitter = new NativeEventEmitter(
      NativeModules.MyEventEmitter,
    );
    imageAvailableEventEmitter.addListener('image-available', (imageUrl) => {
      setPhotoUri(imageUrl);
    });

    const speedEventEmitter = new NativeEventEmitter(
      NativeModules.SpeedEventEmitter,
    );
    speedEventEmitter.addListener('speed-available', (speed: number) => {
      console.log('Got speed:', speed);
      //broadcastSpeed(name, Number(Number(speed).toFixed(2)));
    });

    console.log('We are now listening to image-available');

    initializeDatabase();
  }, []);
  const [status, setStatus] = useState('initialized');

  const [photoUri, setPhotoUri] = useState('');

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
    analyze(
      'file:///Users/aris/Library/Developer/CoreSimulator/Devices/D5565BBE-48DA-4821-9086-EE9D54432BA4/data/Media/DCIM/100APPLE/IMG_0007.MOV',
      1.0,
      0,
      -1,
      () => {},
    );
  };

  const [showCalibrationPanel, setShowCalibrationPanel] = useState(false);
  const clickedCalibrate = () => {
    if (!showCalibrationPanel) {
      takePicture();
    }
    setShowCalibrationPanel(!showCalibrationPanel);
  };

  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);

  const clickedRecord = () => {
    setIsRecording(true);
    isRecordingRef.current = true;
    startVideoRecording();
  };

  const clickedStop = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
  };

  const [progression, setProgression] = useState(1);

  const analyze = async (
    uri: string,
    duration: number,
    startIndex: number,
    endIndex: number,
    callback: (speedFound: boolean, speed: number) => void,
  ) => {
    const calibrationInfo = await getCalibrationInfo();

    NativeModules.ImageProcessor.process(
      uri,
      fps,
      duration,
      calibrationInfo.pixelsPerMeter,
      calibrationInfo.boundsX1 / imageResizeFactor,
      calibrationInfo.boundsY1 / imageResizeFactor,
      calibrationInfo.boundsX2 / imageResizeFactor,
      calibrationInfo.boundsY2 / imageResizeFactor,
      startIndex,
      endIndex,
      (speedFound: boolean, speed: number) => {
        callback(speedFound, speed);
      },
    );
  };

  const executeSingleRecordingSequence = async () => {
    console.log('Playing start sound...');
    await playStartSound();

    console.log('Starting video recording...');
    const promise = new Promise<void>((resolve, reject) => {
      cameraRef.current?.startRecording({
        onRecordingFinished: (video) => {
          playEndSound();
          console.log('Got video:', video);

          analyze(
            video.path,
            video.duration,
            0,
            -1,
            async (speedFound: boolean, speed: number) => {
              console.log(
                'returned from analysis speedFound=',
                speedFound,
                ' speed=',
                speed,
              );

              if (speedFound) {
                await moveAndSaveFile(video.path, video.duration, speed);
                setProgression(progression + 1);
              }
              resolve();
            },
          );
        },
        onRecordingError: (error) => {
          console.error('Error recording:', error);
          playErrorSound();
          reject();
        },
      });

      setTimeout(() => {
        console.log('Got timeout to stop video recording');
        stopVideoRecording();
      }, 3000);
    });

    return promise;
  };

  const startVideoRecording = async () => {
    while (isRecordingRef.current) {
      await executeSingleRecordingSequence();
      await sleep(5000);
    }
  };

  const stopVideoRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const rerunAnalysis = () => {};

  const playSound = async () => {
    playErrorSound();
  };

  const onCallSql = async () => {
    console.log('Executing sql');
    await selectVideos();
  };

  const analyzeShot = (videoDetails: VideoDetails) => {
    analyze(
      `file:///private/${RNFS.DocumentDirectoryPath}/${videoDetails.url}`,
      videoDetails.duration,
      0,
      -1,
      async (speedFound: boolean, speed: number) => {
        console.log('Came back from analysis.');
      },
    );
  };

  const onPressListFiles = async () => {
    console.log('Current document directory path:', RNFS.DocumentDirectoryPath);

    const items = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    console.log('ITems length is ', items.length);
    for (var i = 0; i < items.length; i++) {
      const item = items[i];
      console.log('Found file: ', item.name, item.ctime, item.path, item.size);
    }
  };

  const onPressResetFiles = async () => {
    await deleteVideos();
    const items = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    for (var i = 0; i < items.length; i++) {
      const item = items[i];
      RNFS.unlink(item.path);
    }
    setProgression(1);
  };

  const increaseProgression = () => {
    setProgression(progression + 1);
  };

  const showCamera = cameraConfiguration != undefined && permissionGranted;

  const onPressTurnOnBulb = () => {
    NativeModules.Bulb.turnOn();
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
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
              {photoUri != '' && (
                <Image
                  source={{uri: photoUri}}
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    borderColor: 'red',
                  }}
                  resizeMode={'contain'}
                />
              )}
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

              <Button onPress={playSound} title="Play Sound" color="#841584" />

              <Button
                onPress={stopVideoRecording}
                title="Try Stop Video Recording Again"
                color="#841584"
              />

              <Button
                onPress={takePicture}
                title="Take snapshot"
                color="#841584"
              />

              <Button
                onPress={onCallSql}
                title="Check Video Files"
                color="#841584"
              />

              <Button
                onPress={onPressTurnOnBulb}
                title="call turn on bulb"
                color="#841584"
              />

              <Button
                onPress={increaseProgression}
                title="Increase progression"
                color="#841584"
              />

              <Button
                onPress={onPressListFiles}
                title="List Files"
                color="#841584"
              />

              <Button
                onPress={onPressResetFiles}
                title="Reset Files"
                color="#841584"
              />

              <ShotHistory
                progression={progression}
                selectedShot={analyzeShot}></ShotHistory>

              <StatusBox status={status}></StatusBox>
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

const marginStyle: ViewStyle = {
  marginTop: 10,
  marginBottom: 20,
};

export default App;
