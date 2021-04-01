export default function calculateCalibration(
  leftCalibrationX: number,
  leftCalibrationY: number,
  rightCalibrationX: number,
  rightCalibrationY: number,
  calibrationStickLengthInM: number,
  imageResizeFactor: number,
) {
  const xDistance = Math.abs(rightCalibrationX - leftCalibrationX);
  const yDistance = Math.abs(rightCalibrationY - leftCalibrationY);

  const distanceInPixels = Math.sqrt(
    xDistance * xDistance + yDistance * yDistance,
  );
  console.log('distance in pixels:', distanceInPixels);

  const pixelsPerMeterInScreenCoordinates =
    distanceInPixels / calibrationStickLengthInM;
  console.log(
    'pixels per meter (screen coordinates): ',
    pixelsPerMeterInScreenCoordinates,
  );

  const pixelsPerMeterInVideoCoordinates =
    pixelsPerMeterInScreenCoordinates / imageResizeFactor;

  console.log(
    'pixels per meter (video coordinates): ',
    pixelsPerMeterInVideoCoordinates,
  );

  return Math.round(pixelsPerMeterInVideoCoordinates);
}
