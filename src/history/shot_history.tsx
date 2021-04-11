import dateFormat from 'dateformat';
import React, {Dispatch, SetStateAction, useEffect, useState} from 'react';
import {Button, TextStyle, View, ViewStyle} from 'react-native';
import {Row, Table} from 'react-native-table-component';
import {executeSql} from './database';
import VideoDetails from './video_details';

type Props = {
  progression: number;
  selectedShot: (videoDetails: VideoDetails) => void;
};

export default function ShotHistory(props: Props): React.ReactElement {
  const [videos, setVideos] = useState<VideoDetails[]>([]);

  console.log('Progression is', props.progression);

  useEffect(() => {
    console.log('Loading history');
    loadHistory(setVideos);
  }, [props.progression]);

  return <View>{renderVideoTable(videos, props)}</View>;
}

function renderVideoTable(
  videos: VideoDetails[],
  props: Props,
): React.ReactElement {
  const headers = ['Date', 'Time', 'Name', 'Shot speed (MPH)', 'Action'];
  return (
    <View style={overallView}>
      <Table borderStyle={tableBorderStyle}>
        <Row
          data={headers}
          style={tableHeaderStyle}
          textStyle={textStyle}></Row>
        {renderVideoRows(videos, props)}
      </Table>
    </View>
  );
}

function renderVideoRows(
  videos: VideoDetails[],
  props: Props,
): React.ReactElement[] {
  return videos.map<React.ReactElement>(
    (videoDetails: VideoDetails, index: number) => {
      return renderVideo(videoDetails, props, index);
    },
  );
}

function renderVideo(videoDetails: VideoDetails, props: Props, index: number) {
  const videoDate = new Date(videoDetails.date);
  const clickedView = () => {
    props.selectedShot(videoDetails);
  };

  const buttonElement = (
    <Button onPress={clickedView} title="Analyze" color="#841584" />
  );
  const data = [
    dateFormat(videoDate, 'mmm dd (ddd)'),
    dateFormat(videoDate, 'hh:MM TT'),
    videoDetails.name,
    videoDetails.speedMph,
    buttonElement,
  ];
  return <Row data={data} key={index} textStyle={textStyle}></Row>;
}

const msPerDay = 1000 * 60 * 60 * 12;

async function loadHistory(
  setVideos: Dispatch<SetStateAction<VideoDetails[]>>,
) {
  const now = new Date();
  const videos: VideoDetails[] = await executeSql(
    'select rowId, * from videos order by date desc',
  );

  console.log('videos', videos);

  setVideos(videos);
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
