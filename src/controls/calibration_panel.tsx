import AsyncStorage from '@react-native-community/async-storage';
import React, {useEffect, useState} from 'react';
import {Button, Image, ImageStyle, Text, View, ViewStyle} from 'react-native';
import {imageHeight, imageWidth} from '../camera/my_camera';
import Bounds from './bounds';

type Props = {
  showPanel: boolean;
};

export type Coordinate = {
  x: number;
  y: number;
};

export default function CalibrationPanel(props: Props): React.ReactElement {
  const [leftCalibrationPoint, setLeftCalibrationPoint] = useState({
    x: 50,
    y: imageHeight / 2,
  });

  const [rightCalibrationPoint, setRightCalibrationPoint] = useState({
    x: imageWidth - 50,
    y: imageHeight / 2,
  });

  const [upperLeftBoundary, setUpperLeftBoundary] = useState({x: 10, y: 10});
  const [lowerRightBoundary, setLowerRightBoundary] = useState({
    x: 100,
    y: 100,
  });

  const [loadedCalibrationPoint, setLoadedCalibrationPoint] = useState(false);

  useEffect(() => {
    const loadCalibrationPoints = async () => {
      const leftCalibrationX =
        (await AsyncStorage.getItem('leftCalibrationX')) ?? 50;
      const leftCalibrationY =
        (await AsyncStorage.getItem('leftCalibrationY')) ?? imageHeight / 2;
      const rightCalibrationX =
        (await AsyncStorage.getItem('rightCalibrationX')) ?? imageWidth - 50;
      const rightCalibrationY =
        (await AsyncStorage.getItem('rightCalibrationY')) ?? imageHeight / 2;

      const boundsX1 = (await AsyncStorage.getItem('boundsX1')) ?? 10;
      const boundsY1 = (await AsyncStorage.getItem('boundsY1')) ?? 10;
      const boundsX2 = (await AsyncStorage.getItem('boundsX2')) ?? 100;
      const boundsY2 = (await AsyncStorage.getItem('boundsY2')) ?? 100;

      setLeftCalibrationPoint({
        x: Number(leftCalibrationX),
        y: Number(leftCalibrationY),
      });

      setRightCalibrationPoint({
        x: Number(rightCalibrationX),
        y: Number(rightCalibrationY),
      });

      setUpperLeftBoundary({x: Number(boundsX1), y: Number(boundsY1)});
      setLowerRightBoundary({x: Number(boundsX2), y: Number(boundsY2)});

      setLoadedCalibrationPoint(true);

      console.log('loaded calibration points');
    };
    loadCalibrationPoints();
  }, []);

  if (!props.showPanel || !loadedCalibrationPoint) {
    return <></>;
  }

  const onPressReset = () => {};

  console.log('upper left', upperLeftBoundary);
  console.log('lower right', lowerRightBoundary);

  const source = {};
  return (
    <View>
      <View
        style={{
          ...crossHairPanel,
          left: leftCalibrationPoint.x,
          top: leftCalibrationPoint.y,
        }}>
        <View style={crossHairDot}></View>
        <View style={crossHairVertical}></View>
        <View style={crossHairHorizontal}></View>
      </View>
      <View
        style={{
          ...crossHairPanel,
          left: rightCalibrationPoint.x,
          top: rightCalibrationPoint.y,
        }}>
        <View style={crossHairDot}></View>
        <View style={crossHairVertical}></View>
        <View style={crossHairHorizontal}></View>
      </View>
      <Bounds
        upperLeftBoundary={upperLeftBoundary}
        lowerRightBoundary={lowerRightBoundary}></Bounds>
      <Image style={imageStyle} source={source}></Image>
      <View style={panelView}>
        <View style={twoControllerHolder}>
          <Controller
            calibrationPoint={'left'}
            coordinate={leftCalibrationPoint}
            setCoordinate={setLeftCalibrationPoint}
            onPressReset={onPressReset}></Controller>
          <Controller
            calibrationPoint={'right'}
            coordinate={rightCalibrationPoint}
            setCoordinate={setRightCalibrationPoint}
            onPressReset={onPressReset}></Controller>
        </View>
        <Text style={styles.sectionTitle}>Calibration</Text>
      </View>
    </View>
  );
}

type ControllerProps = {
  calibrationPoint: 'left' | 'right';
  coordinate: Coordinate;
  setCoordinate: (coordinate: Coordinate) => void;
  onPressReset: () => void;
};

function Controller(props: ControllerProps): React.ReactElement {
  const onPress = (xChange: number, yChange: number) => {
    return () => {
      const newX = props.coordinate.x + xChange * 10;
      const newY = props.coordinate.y + yChange * 10;
      AsyncStorage.setItem(props.calibrationPoint + 'CalibrationX', '' + newX);
      AsyncStorage.setItem(props.calibrationPoint + 'CalibrationY', '' + newY);
      props.setCoordinate({
        x: newX,
        y: newY,
      });
    };
  };

  return (
    <View style={controllerOverall}>
      <Button title={'RESET'} onPress={props.onPressReset}></Button>
      <View style={roundButton}>
        <Button title={'⇧'} onPress={onPress(0, -1)}></Button>
      </View>
      <View style={buttonRow}>
        <View style={roundButton}>
          <Button title={'⇦'} onPress={onPress(-1, 0)}></Button>
        </View>
        <View style={roundButton}>
          <Button title={'⇨'} onPress={onPress(1, 0)}></Button>
        </View>
      </View>
      <View style={roundButton}>
        <Button title={'⇩'} onPress={onPress(0, 1)}></Button>
      </View>
    </View>
  );
}

const imageStyle: ImageStyle = {
  width: imageWidth,
  height: imageHeight,
  borderWidth: 1,
  borderColor: 'red',
};

const crossHairPanel: ViewStyle = {
  position: 'absolute',
  top: imageHeight / 2,
  left: 50,
};

const crossHairDot: ViewStyle = {
  position: 'absolute',
  backgroundColor: 'red',
  width: 10,
  height: 10,
  borderRadius: 5,
  top: -5,
  left: -5,
};

const crossHairVertical: ViewStyle = {
  position: 'absolute',
  backgroundColor: 'red',
  width: 2,
  height: 40,
  top: -20,
  left: -1,
};

const crossHairHorizontal: ViewStyle = {
  position: 'absolute',
  backgroundColor: 'red',
  width: 40,
  height: 2,
  top: -1,
  left: -20,
};

const styles = {
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#55C3F0',
    textAlign: 'center',
  },
};

const panelView: ViewStyle = {
  position: 'absolute',
  borderColor: 'rgba(255,0,0,1)',
  borderWidth: 1,
  width: imageWidth,
  height: imageHeight,
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingBottom: 30,
};

const twoControllerHolder: ViewStyle = {
  flexDirection: 'row',
};

const controllerOverall: ViewStyle = {
  alignItems: 'center',
  marginLeft: 80,
  marginRight: 80,
};

const buttonRow: ViewStyle = {
  flexDirection: 'row',
};

const roundButton: ViewStyle = {
  width: 40,
  height: 40,
  marginLeft: 13,
  marginRight: 13,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#55C3F0',
  justifyContent: 'center',
};
