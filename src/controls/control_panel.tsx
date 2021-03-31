import React from 'react';
import {StyleSheet, View} from 'react-native';
import ControlButton from './control_button';

type Props = {
  onPressCalibrate: () => void;
  onPressRecord: () => void;
  onPressStop: () => void;
  isRecording: boolean;
};

export default function ControlPanel(props: Props): React.ReactElement {
  return (
    <View style={styles.overallView}>
      <ControlButton title="Calibrate" onPress={props.onPressCalibrate} />
      {!props.isRecording && (
        <ControlButton title="Record" onPress={props.onPressRecord} />
      )}
      {props.isRecording && (
        <ControlButton
          style={{backgroundColor: 'rgba(255,0,0,0.5)'}}
          title="Stop"
          onPress={props.onPressStop}
        />
      )}
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
