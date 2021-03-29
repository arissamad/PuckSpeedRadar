import React, {useState} from 'react';
import {Button, Image, ImageStyle, Text, View, ViewStyle} from 'react-native';
import {imageHeight, imageWidth} from '../camera/my_camera';

type Props = {
  showPanel: boolean;
};

type Coordinate = {
  x: number;
  y: number;
};

export default function CalibrationPanel(props: Props): React.ReactElement {
  if (!props.showPanel) {
    return <></>;
  }

  const [leftCalibrationPoint, setLeftCalibrationPoint] = useState({
    x: 50,
    y: imageHeight / 2,
  });

  const [rightCalibrationPoint, setRightCalibrationPoint] = useState({
    x: imageWidth - 50,
    y: imageHeight / 2,
  });

  const onPressReset = () => {};

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
      <Image style={imageStyle} source={source}></Image>
      <View style={panelView}>
        <View style={twoControllerHolder}>
          <Controller
            coordinate={leftCalibrationPoint}
            setCoordinate={setLeftCalibrationPoint}
            onPressReset={onPressReset}></Controller>
          <Controller
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
  coordinate: Coordinate;
  setCoordinate: (coordinate: Coordinate) => void;
  onPressReset: () => void;
};

function Controller(props: ControllerProps): React.ReactElement {
  const onPress = (xChange: number, yChange: number) => {
    return () => {
      props.setCoordinate({
        x: props.coordinate.x + xChange * 10,
        y: props.coordinate.y + yChange * 10,
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