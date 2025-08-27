import { createTheme, ThemeProvider } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

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
        xAxis={[{ data: props?.xAxis || [] }]}
        series={props?.series || [] }
        width={250}
        height={200}
        />
    </ThemeProvider>
  );
}