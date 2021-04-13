import AsyncStorage from '@react-native-community/async-storage';
import {imageResizeFactor} from '../camera/my_camera';
import calculateCalibration from '../utils/calculate_calibration';

type CalibrationInfo = {
  name: string;
  boundsX1: number;
  boundsY1: number;
  boundsX2: number;
  boundsY2: number;
  leftCalibrationX: number;
  leftCalibrationY: number;
  rightCalibrationX: number;
  rightCalibrationY: number;
  calibrationDistance: number;
  pixelsPerMeter: number;
};

export default async function getCalibrationInfo() {
  const promise = new Promise<CalibrationInfo>((resolve, reject) => {
    AsyncStorage.multiGet(
      [
        'leftCalibrationX',
        'leftCalibrationY',
        'rightCalibrationX',
        'rightCalibrationY',
        'boundsX1',
        'boundsY1',
        'boundsX2',
        'boundsY2',
        'name',
        'calibrationDistance',
      ],
      (errors, results) => {
        console.log('Any errors during AsyncStorage.multiGet: ', errors);
        if (results == null) {
          reject();
          return;
        }

        const leftCalibrationX = Number(results[0][1]);
        const leftCalibrationY = Number(results[1][1]);
        const rightCalibrationX = Number(results[2][1]);
        const rightCalibrationY = Number(results[3][1]);

        const boundsX1 = Number(results[4][1]);
        const boundsY1 = Number(results[5][1]);
        const boundsX2 = Number(results[6][1]);
        const boundsY2 = Number(results[7][1]);

        const name = results[8][1] ?? 'noname';

        const calibrationDistance = Number(results[9][1]);

        console.log(
          `calibration points: (${leftCalibrationX}, ${leftCalibrationY}) - (${rightCalibrationX}, ${rightCalibrationY})`,
        );
        console.log(
          `bounds: (${boundsX1}, ${boundsY1}) - (${boundsX2}, ${boundsY2})`,
        );

        const pixelsPerMeter = calculateCalibration(
          leftCalibrationX,
          leftCalibrationY,
          rightCalibrationX,
          rightCalibrationY,
          calibrationDistance,
          imageResizeFactor,
        );

        resolve({
          name,
          boundsX1,
          boundsY1,
          boundsX2,
          boundsY2,
          leftCalibrationX,
          leftCalibrationY,
          rightCalibrationX,
          rightCalibrationY,
          calibrationDistance,
          pixelsPerMeter,
        });
      },
    );
  });

  return promise;
}
