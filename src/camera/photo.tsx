import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

type Props = {
  photoUri: string;
};
export default function Photo(props: Props): React.ReactElement {
  if (props.photoUri == '') {
    return <View />;
  }
  const source = {
    uri: props.photoUri,
  };
  console.log('displaying image at ', props.photoUri);
  return <Image style={styles.imageStyle} source={source} />;
}

const styles = StyleSheet.create({
  imageStyle: {
    width: 300,
    height: 300,
    borderWidth: 1,
    borderColor: 'black',
  },
});
