import { ChartContainer } from '@mui/x-charts/ChartContainer';
import {
  LinePlot,
  MarkPlot,
  lineElementClasses,
  markElementClasses,
} from '@mui/x-charts/LineChart';

export default function TinyLineChart(props) {
  return (
    <ChartContainer
      width={166}
      height={100}
      series={[{ type: 'line', data: props.data }]}
      xAxis={[{ scaleType: 'point', data: props.xLabels, position: 'none' }]}
      yAxis={[{ position: 'none' }]}
      sx={{
        [`& .${lineElementClasses.root}`]: {
          stroke: '#8884d8',
          strokeWidth: 2,
        },
        [`& .${markElementClasses.root}`]: {
          stroke: 'none', 
          r: 2, // Modify the circle radius
          fill: 'white',
          strokeWidth: 2,
        },
      }}
      disableAxisListener
    >
      <LinePlot />
      <MarkPlot />
    </ChartContainer>
  );
}