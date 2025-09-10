import { createTheme, ThemeProvider } from '@mui/material';
import {
  LineChart,
  LinePlot,
  MarkPlot,
  lineElementClasses,
  markElementClasses,
} from '@mui/x-charts/LineChart';

const darkTheme = createTheme({
palette: {
mode: 'dark',
},
});

export default function BasicLineChart(props) {
  return (
    <ThemeProvider theme={darkTheme}>
        <LineChart
        // xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
        // series={[
        //     {
        //     data: [2, 5.5, 2, 8.5, 1.5, 5],
        //     },
        // ]}
        {...(props.basicX ? {xAxis: [{data: props?.xAxis || [], position: 'none'}]}:{xAxis: props.xAxis})}
        yAxis={[{min: 0}]}
        series={props?.series || [] }
        width={250}
        height={200}
        sx={{
          [`& .${markElementClasses.root}`]: {
            r: 2, // Modify the circle radius
          },
        }}
        />
    </ThemeProvider>
  );
}