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
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import RNBeep from 'react-native-a-beep';
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
import StatusBox from './src/status/status_box';
import calculateCalibration from './src/utils/calculate_calibration';
import {
  leftAlignedRow,
  textInputStyle,
  textLabelStyle,
} from './src/utils/common_styles';
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
  const [name, setName] = useState('');

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

  const analyze = (
    uri: string,
    duration: number,
    startIndex: number,
    endIndex: number,
    callback: (speedFound: boolean) => void,
  ) => {
    AsyncStorage.multiGet(
      [
        'leftCalibrationX',
        'leftCalibrationY',
        'rightCalibrationX',
        'rightCalibrationY',
        'boundsX1',
        'boundsY1',
        'boundsX2',
        'boundsY2',
        'name',
        'calibrationDistance',
      ],
      (errors, results) => {
        console.log('Any errors during AsyncStorage.multiGet: ', errors);
        if (results == null) {
          return;
        }

        const leftCalibrationX = Number(results[0][1]);
        const leftCalibrationY = Number(results[1][1]);
        const rightCalibrationX = Number(results[2][1]);
        const rightCalibrationY = Number(results[3][1]);

        const boundsX1 = Number(results[4][1]) / imageResizeFactor;
        const boundsY1 = Number(results[5][1]) / imageResizeFactor;
        const boundsX2 = Number(results[6][1]) / imageResizeFactor;
        const boundsY2 = Number(results[7][1]) / imageResizeFactor;

        const name = results[8][1];
        setName(name ?? 'Aris');

        const calibrationDistance = results[9][1];

        console.log(
          'calibration points',
          leftCalibrationX,
          leftCalibrationY,
          rightCalibrationX,
          rightCalibrationY,
        );
        console.log('bounds', boundsX1, boundsY1, boundsX2, boundsY2);

        const pixelsPerMeter = calculateCalibration(
          leftCalibrationX,
          leftCalibrationY,
          rightCalibrationX,
          rightCalibrationY,
          Number(calibrationDistance),
          imageResizeFactor,
        );

        NativeModules.ImageProcessor.process(
          uri,
          fps,
          duration,
          pixelsPerMeter,
          boundsX1,
          boundsY1,
          boundsX2,
          boundsY2,
          startIndex,
          endIndex,
          (speedFound: boolean) => {
            callback(speedFound);
          },
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

  const [timer, setTimer] = useState(0);

  const executeSingleRecordingSequence = async () => {
    console.log('Playing start sound...');
    await playStartSound();

    console.log('Starting video recording...');
    const promise = new Promise<void>((resolve, reject) => {
      cameraRef.current?.startRecording({
        onRecordingFinished: (video) => {
          playEndSound();
          console.log('Got video:', video);

          analyze(video.path, video.duration, 0, -1, (speedFound: boolean) => {
            console.log('returned from analysis speedFound=', speedFound);

            if (speedFound) {
              const videoDetails: VideoDetails = {
                uri: video.path,
                duration: video.duration,
              };
              setLastVideoDetails(videoDetails);
              AsyncStorage.getItem('recentVideoDetails').then(
                (value: string | null) => {
                  var recentVideoDetails: VideoDetails[];
                  if (value) {
                    recentVideoDetails = JSON.parse(value);
                  } else {
                    recentVideoDetails = [];
                  }

                  recentVideoDetails.unshift(videoDetails);
                  if (recentVideoDetails.length > 3) {
                    recentVideoDetails.splice(3, 5);
                  }

                  AsyncStorage.setItem(
                    'recentVideoDetails',
                    JSON.stringify(recentVideoDetails),
                  );
                },
              );
            }
            resolve();
          });
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

  const rerunAnalysis = () => {
    analyze(lastVideoDetails.uri, lastVideoDetails.duration, 0, -1, () => {});
  };

  const rerunAnalysisSlow = () => {
    analyze(
      lastVideoDetails.uri,
      lastVideoDetails.duration,
      startIndex,
      endIndex,
      () => {},
    );
  };

  const playSound = async () => {
    playErrorSound();
    // await playStartSound();
    // await sleep(5000);
    // await playEndSound();
    // for (var i = 1109; i < 1119; i++) {
    //   console.log('Playing', i);
    //   RNBeep.PlaySysSound(i);
    //   await new Promise((r) => setTimeout(r, 2000));
    // }
  };

  const nothing = () => {
    RNBeep.PlaySysSound(1100);
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

  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(100);

  const changeStartIndex = (value: string) => {
    setStartIndex(Number(value));
  };

  const changeEndIndex = (value: string) => {
    setEndIndex(Number(value));
  };

  const onPressTurnOnBulb = () => {
    NativeModules.Bulb.turnOn();
  };

  const [recentIndex, setRecentIndex] = useState('');

  const rerunRecentAnalysis = () => {
    AsyncStorage.getItem('recentVideoDetails').then((value: string | null) => {
      if (value) {
        const recentVideoDetails: VideoDetails[] = JSON.parse(value);
        if (recentVideoDetails.length > Number(recentIndex)) {
          const videoDetails = recentVideoDetails[Number(recentIndex)];
          console.log('got video details', videoDetails);

          analyze(videoDetails.uri, videoDetails.duration, 0, -1, () => {});
        }
      }
    });
  };

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

              <View style={[leftAlignedRow, marginStyle]}>
                <Text style={textLabelStyle}>
                  Recent Index (0 most recent):
                </Text>
                <TextInput
                  style={textInputStyle}
                  keyboardType={'numeric'}
                  onChangeText={setRecentIndex}></TextInput>
                <Button
                  onPress={rerunRecentAnalysis}
                  title="Rerun Analysis"
                  color="#841584"
                />
              </View>

              <View style={[leftAlignedRow, marginStyle]}>
                <Text style={textLabelStyle}>Start Index:</Text>
                <TextInput
                  style={textInputStyle}
                  keyboardType={'numeric'}
                  onChangeText={changeStartIndex}></TextInput>
                <Text style={textLabelStyle}>End Index:</Text>
                <TextInput
                  style={textInputStyle}
                  keyboardType={'numeric'}
                  onChangeText={changeEndIndex}></TextInput>
                <Button
                  onPress={rerunAnalysisSlow}
                  title="Rerun Last Analysis - Slow"
                  color="#841584"
                />
              </View>

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
                onPress={onPressLearnMore}
                title="Toggle Status"
                color="#841584"
              />

              <Button
                onPress={onPressTurnOnBulb}
                title="call turn on bulb"
                color="#841584"
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

const marginStyle: ViewStyle = {
  marginTop: 10,
  marginBottom: 20,
};

export default App;
