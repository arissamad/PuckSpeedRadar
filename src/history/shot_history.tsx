import dateFormat from 'dateformat';
import React, {Dispatch, SetStateAction, useEffect, useState} from 'react';
import {Button, Text, TextStyle, View, ViewStyle} from 'react-native';
import RNFS from 'react-native-fs';
import {Row, Table} from 'react-native-table-component';
import {executeSql} from './database';
import VideoDetails from './video_details';

type Props = {
  progression: number;
  selectedShot: (videoDetails: VideoDetails) => void;
};

export default function ShotHistory(props: Props): React.ReactElement {
  const [videos, setVideos] = useState<VideoDetails[]>([]);
  const [internalProgression, setInternalProgression] = useState(1);
  const updateHistory = () => {
    setInternalProgression(internalProgression + 1);
  };

  console.log('Progression is', props.progression);

  useEffect(() => {
    console.log('Loading history');
    loadHistory(setVideos);
  }, [props.progression, internalProgression]);

  return (
    <View>
      <View>{renderVideoTable(videos, props, updateHistory)}</View>
      <View>
        <Text>Hello, world{internalProgression}</Text>
      </View>
    </View>
  );
}

function renderVideoTable(
  videos: VideoDetails[],
  props: Props,
  updateHistory: () => void,
): React.ReactElement {
  const headers = [
    'Delete',
    'Date',
    'Time',
    'Name',
    'Shot speed (MPH)',
    'Action',
  ];
  return (
    <View style={overallView}>
      <Table borderStyle={tableBorderStyle}>
        <Row
          data={headers}
          style={tableHeaderStyle}
          textStyle={textStyle}></Row>
        {renderVideoRows(videos, props, updateHistory)}
      </Table>
    </View>
  );
}

function renderVideoRows(
  videos: VideoDetails[],
  props: Props,
  updateHistory: () => void,
): React.ReactElement[] {
  return videos.map<React.ReactElement>(
    (videoDetails: VideoDetails, index: number) => {
      return renderVideo(videoDetails, props, index, updateHistory);
    },
  );
}

function renderVideo(
  videoDetails: VideoDetails,
  props: Props,
  index: number,
  updateHistory: () => void,
) {
  const clickedDelete = async () => {
    await deleteVideo(videoDetails);
    console.log('Now updating history');
    updateHistory();
  };
  const deleteButtonElement = (
    <Button onPress={clickedDelete} title="Delete" color="#841584" />
  );

  const clickedView = () => {
    props.selectedShot(videoDetails);
  };
  const analyzeButtonElement = (
    <Button onPress={clickedView} title="Analyze" color="#841584" />
  );

  const data = [
    deleteButtonElement,
    dateFormat(videoDetails.date, 'mmm dd (ddd)'),
    dateFormat(videoDetails.date, 'hh:MM TT'),
    videoDetails.name,
    videoDetails.speedMph.toFixed(1),
    analyzeButtonElement,
  ];
  return <Row data={data} key={index} textStyle={textStyle}></Row>;
}

const msPerDay = 1000 * 60 * 60 * 12;

async function loadHistory(
  setVideos: Dispatch<SetStateAction<VideoDetails[]>>,
) {
  const now = new Date();
  const videos: VideoDetails[] = await executeSql(
    'select rowId as rowId, * from videos order by date desc limit 20',
  ).catch((error) => {
    console.log('Could not load videos', error);
    return [];
  });

  var regex = /(\d\d\d\d-\d\d-\d\d) (\d\d:\d\d:\d\d)/;
  for (const video of videos) {
    const groups = regex.exec(video.date as any);
    if (groups == null) {
      continue;
    }
    const formattedDate = `${groups?.[1]}T${groups?.[2]}.000+08:00`;
    video.date = new Date(Date.parse(formattedDate));
  }

  setVideos(videos);
}

async function deleteVideo(videoDetails: VideoDetails) {
  await executeSql('delete from videos where rowId = ' + videoDetails.rowId);
  const filePath = RNFS.DocumentDirectoryPath + '/' + videoDetails.url;
  await RNFS.unlink(filePath).catch((error) => {
    console.log('Problem deleting file', error);
  });
}

const overallView: ViewStyle = {
  marginTop: 15,
  marginBottom: 15,
};

const tableBorderStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: '#c8e1ff',
};

const tableHeaderStyle: ViewStyle = {
  backgroundColor: '#f1f8ff',
};

const textStyle: TextStyle = {
  margin: 6,
};
