import React from 'react';
import {StyleSheet, View} from 'react-native';
import ControlButton from './control_button';

type Props = {};

export default function ControlPanel(props: Props): React.ReactElement {
  const onPressCalibrate = () => {
    console.log('Pressed calibrate');
  };

  return (
    <View style={styles.overallView}>
      <ControlButton title="Calibrate" onPress={onPressCalibrate} />
      <ControlButton title="Record" onPress={onPressCalibrate} />
    </View>
  );
}

const styles = StyleSheet.create({
  overallView: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
