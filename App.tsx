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
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ImageLibraryOptions,
  ImagePickerResponse,
  launchImageLibrary,
} from 'react-native-image-picker';
import {Camera} from 'react-native-vision-camera';
import {
  Colors,
  Header,
  LearnMoreLinks,
} from 'react-native/Libraries/NewAppScreen';
import broadcastSpeed2 from './src/broadcaster/firestore_broadcaster';
import getCameraConfiguration, {
  CameraConfig,
} from './src/camera/get_camera_configuration';
import getPermissions from './src/camera/get_permissions';
import MyCamera from './src/camera/my_camera';
import Photo from './src/camera/photo';
import StatusBox from './src/status/status_box';

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
      .then((snapshot) => {
        console.log('got photo', snapshot);
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
      (newImageUrl: string) => {
        console.log('arguments', newImageUrl);
        setPhotoUri(newImageUrl);
      },
    );
  };

  const callSwiftWithSelectedVideo = () => {
    console.log('calling swift');
    NativeModules.Bulb.turnOn();
    NativeModules.ImageProcessor.process(
      selectedVideoUri,
      (newImageUrl: string) => {
        console.log('arguments', newImageUrl);
        setPhotoUri(newImageUrl);
      },
    );
  };

  const pickVideo = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'video',
      videoQuality: 'high',
    };
    launchImageLibrary(options, (responseObject: ImagePickerResponse) => {
      console.log('Response', responseObject);
      console.log('URI', responseObject.uri);
      setVideoUri(responseObject.uri!);
    });
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
          <Header />
          <View style={styles.body}>
            <StatusBox status={status}></StatusBox>

            <MyCamera
              showCamera={showCamera}
              cameraConfig={cameraConfiguration as CameraConfig}
              cameraRef={cameraRef}></MyCamera>

            <Photo photoUri={photoUri} />

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Learn More</Text>
              <Text style={styles.sectionDescription}>
                Read the docs to discover what to do next:
              </Text>
              <Button
                onPress={callSwiftWithSimulatorVideo}
                title="Call swift (Simulator Video)"
                color="#841584"
              />

              <Button
                onPress={callSwiftWithSelectedVideo}
                title="Call swift (Selected Video)"
                color="#841584"
              />

              <Button
                onPress={pickVideo}
                title="Select video file"
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
            </View>
            <LearnMoreLinks />
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
