import {TextStyle, ViewStyle} from 'react-native';

export const leftAlignedRow: ViewStyle = {
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
};

export const textLabelStyle: TextStyle = {
  fontSize: 20,
};

export const textInputStyle: TextStyle = {
  borderColor: 'grey',
  borderWidth: 1,
  padding: 5,
  fontSize: 20,
  marginLeft: 10,
  flexGrow: 1,
  marginRight: 10,
};
