import React from 'react';
import {StyleSheet, View} from 'react-native';
import ControlButton from './control_button';

type Props = {
  onPressCalibrate: () => void;
  onPressRecord: () => void;
};

export default function ControlPanel(props: Props): React.ReactElement {
  return (
    <View style={styles.overallView}>
      <ControlButton title="Calibrate" onPress={props.onPressCalibrate} />
      <ControlButton title="Record" onPress={props.onPressRecord} />
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
