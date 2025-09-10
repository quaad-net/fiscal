import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

export default function SparkBar(props) {
  return (
        <div style={{float: 'right', border: 0}}>
          <SparkLineChart
            plotType="bar"
            layout="horizontal"
            // data={[2, 1, ...]}
            data={props.data}
            width={25}
            height={20}
            // color='color'
            color={props.color}
          />
        </div>
  );
}
