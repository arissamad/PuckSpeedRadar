import React from 'react';
import {Button, StyleSheet, View} from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  style?: {[key: string]: any};
};

export default function ControlButton(props: Props): React.ReactElement {
  return (
    <View style={{...styles.buttonStyle, ...props.style}}>
      <Button
        onPress={props.onPress}
        title={props.title}
        color="rgba(250, 250, 250, 0.5)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonStyle: {
    width: 300,
    borderRadius: 20,
    borderColor: 'rgba(250, 250, 250, 0.5)',
    borderWidth: 1,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: 'rgba(30, 30, 30, 0.3)',
    marginLeft: 5,
    marginRight: 40,
    marginBottom: 30,
  },
});
