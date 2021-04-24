import dateFormat from 'dateformat';
import SQLite, {ResultSet, SQLiteDatabase} from 'react-native-sqlite-storage';
import VideoDetails from './video_details';

export function initializeDatabase() {
  (global as any).db = SQLite.openDatabase(
    {
      name: 'SQLite',
      location: 'default',
      createFromLocation: '~SQLite.db',
    },
    async () => {
      console.log('db creation successful', (global as any).db);
      await executeSql(
        'create table if not exists videos (date timestamp with time zone, name text, url text, duration integer, speedMph integer)',
      );
      console.log('back here');
    },
    () => {
      console.log('db creation failed');
    },
  );
  console.log(
    "and now we're back from opening db, which means global.db is set",
  );
}

export async function deleteVideos() {
  console.log('About to delete');
  await executeSql('delete from videos');
  console.log('deleted');
}

export async function insertIntoVideos(videoDetails: VideoDetails) {
  console.log('About to insert', videoDetails);
  await executeSql(
    'insert into videos (date, name, url, duration, speedMph) values (?, ?, ?, ?, ?)',
    [
      sqlDate(videoDetails.date),
      videoDetails.name,
      videoDetails.url,
      videoDetails.duration,
      videoDetails.speedMph,
    ],
  );
  console.log('done inserting');
}

export async function selectVideos() {
  console.log('about to select');
  const results = await executeSql(
    'select rowid, * from videos order by date desc',
  );
  console.log('Done selecting. Results: ', results);
}

export async function executeSql(
  sql: string,
  parameters: any[] = [],
): Promise<any[]> {
  const db: SQLiteDatabase = (global as any).db;

  const promise = new Promise<any[]>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        parameters,
        (_, resultSet: ResultSet) => {
          resolve(resultSet.rows.raw());
        },
        (error: any) => {
          console.log('There was an error:', error);
          reject(
            new Error(
              `Error executing sql statement "${sql}": ` + error.message,
            ),
          );
        },
      );
    });
  });

  return promise;
}

export function sqlDate(date: Date): string {
  const dateStr = dateFormat(date, 'yyyy-mm-dd HH:MM:ss');
  console.log('Date str is ', dateStr);
  return dateStr;
}
