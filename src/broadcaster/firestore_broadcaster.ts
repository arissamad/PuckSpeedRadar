import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

export default async function broadcastSpeed(
  name: string,
  speed: number,
): Promise<void> {
  name = name.toLowerCase();

  const speedReadingsCollection = firestore().collection('speed-readings');
  const latestSpeedDoc = speedReadingsCollection.doc('latest-speed');

  const latestSpeed = await latestSpeedDoc.get();
  console.log('ID:', latestSpeed.id);
  const currentSpeed = latestSpeed.get('speed') as number;
  console.log('Speed:', currentSpeed);

  const timestamp = latestSpeed.get('time') as FirebaseFirestoreTypes.Timestamp;
  console.log('Timestamp', timestamp);
  console.log('Time', new Date(timestamp.toMillis()));

  latestSpeedDoc.set({
    name: name,
    speed: currentSpeed + 1,
    time: new Date(),
  });

  const readingsByName = firestore().collection(`speed-readings/${name}`);
  readingsByName.add({
    speed: speed,
    time: new Date(),
  });

  console.log('set data!');
}
