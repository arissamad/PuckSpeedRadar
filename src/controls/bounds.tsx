import React from 'react';
import {Text, TextStyle, View, ViewStyle} from 'react-native';
import {Coordinate} from './calibration_panel';

type Props = {
  upperLeftBoundary: Coordinate;
  lowerRightBoundary: Coordinate;
};

export default function Bounds(props: Props): React.ReactElement {
  return (
    <View>
      <View
        style={{
          ...verticalBar,
          left: props.upperLeftBoundary.x,
          top: props.upperLeftBoundary.y,
          height: props.lowerRightBoundary.y - props.upperLeftBoundary.y,
        }}></View>
      <View
        style={{
          ...verticalBar,
          left: props.lowerRightBoundary.x,
          top: props.upperLeftBoundary.y,
          height: props.lowerRightBoundary.y - props.upperLeftBoundary.y,
        }}></View>
      <View
        style={{
          ...horizontalBar,
          left: props.upperLeftBoundary.x,
          top: props.upperLeftBoundary.y,
          width: props.lowerRightBoundary.x - props.upperLeftBoundary.x,
        }}></View>
      <View
        style={{
          ...horizontalBar,
          left: props.upperLeftBoundary.x,
          top: props.lowerRightBoundary.y,
          width: props.lowerRightBoundary.x - props.upperLeftBoundary.x,
        }}></View>
      <View
        style={{
          ...dot,
          ...upperLeftDot,
          left: props.upperLeftBoundary.x - 2,
          top: props.upperLeftBoundary.y - 2,
        }}></View>
      <View
        style={{
          ...dot,
          left: props.lowerRightBoundary.x - 5,
          top: props.lowerRightBoundary.y - 5,
        }}></View>
      <Text
        style={{
          ...labelStyle,
          left: props.upperLeftBoundary.x + 10,
          top: props.upperLeftBoundary.y + 2,
        }}>
        upper-left
      </Text>
    </View>
  );
}

const verticalBar: ViewStyle = {
  position: 'absolute',
  width: 2,
  backgroundColor: 'cyan',
};

const horizontalBar: ViewStyle = {
  position: 'absolute',
  height: 2,
  backgroundColor: 'cyan',
};

const dot: ViewStyle = {
  position: 'absolute',
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: 'green',
};

const upperLeftDot: ViewStyle = {
  backgroundColor: 'red',
};

const labelStyle: TextStyle = {
  position: 'absolute',
  color: 'red',
};
