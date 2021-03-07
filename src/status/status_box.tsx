import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const StatusBox = ({status}: {status: string}): React.ReactElement => {
  return (
    <View style={styles.statusBox}>
      <Text>Status: {status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBox: {
    backgroundColor: '#c0c0c0',
    padding: 10,
    paddingLeft: 5,
  },
});

export default StatusBox;
