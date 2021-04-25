import React from 'react';
import {Button, StyleSheet, View} from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  style?: {[key: string]: any};
};

export default function ControlButton(props: Props): React.ReactElement {
  let textColor = 'rgba(250, 250, 250, 0.5)';
  if (props.style?.['color']) {
    textColor = props.style['color'];
  }
  return (
    <View style={{...styles.buttonStyle, ...props.style}}>
      <Button onPress={props.onPress} title={props.title} color={textColor} />
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
    marginRight: 5,
    marginBottom: 30,
  },
});
