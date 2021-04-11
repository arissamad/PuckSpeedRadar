import AsyncStorage from '@react-native-community/async-storage';
import dateFormat from 'dateformat';
import * as RNFS from 'react-native-fs';
import {insertIntoVideos} from './database';
import VideoDetails from './video_details';

export default async function moveAndSaveFile(
  originalFilePath: string,
  duration: number,
  speedMph: number,
) {
  const now = new Date();
  const newFileName = `${dateFormat(now, 'yyyy-mm-dd-HH-MM-ss')}.mov`;

  var newFilePath = RNFS.DocumentDirectoryPath + '/' + newFileName;
  console.log('Moving file to ', newFilePath);
  await RNFS.moveFile(originalFilePath, newFilePath).catch((error) => {
    console.log('problem moving file:', error);
  });

  const name = (await AsyncStorage.getItem('name')) ?? 'noname';

  const videoDetails: VideoDetails = {
    date: new Date(),
    url: newFileName,
    name: name.toLowerCase(),
    duration,
    speedMph,
  };

  await insertIntoVideos(videoDetails);
}
