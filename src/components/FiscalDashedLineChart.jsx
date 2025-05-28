import * as React from 'react';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  LineChart,
  lineElementClasses,
  markElementClasses,
} from '@mui/x-charts/LineChart';

export default function FiscalDashedLineChart(props) {

  const [mobileView, setMobileView]= React.useState(false);
  const margin = { right: 24, ...(mobileView ? {bottom: 0, left: 0} : {})};

  React.useEffect(()=>{
    const atMedia = window.matchMedia("(max-width: 750px)"); //500px
    setMobileView(atMedia.matches);
    
    function updateMobileView(){
      setMobileView(atMedia.matches)
    }
    atMedia.addEventListener('change', updateMobileView);

    return function cleanup(){
      atMedia.removeEventListener('change', updateMobileView);
    }
  },[])

  const darkTheme = createTheme({
    palette: {
    mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>

      <LineChart
        loading={props.lineChartData.length == 0}
        height={mobileView ? 250: 325}
        width={mobileView ? 250 : 500}
        // series={[
        //   { data: [], label: 'string', id: 'string' }, 
        //   { data: [], label: 'string', id: 'string' }, 
        //   {...}
        // ]}
        series={props.lineChartData}
        xAxis={[{ scaleType: 'point', data: props.xLabels }]} //xLabels = []
        yAxis={[{ width: 50 }]}
        sx={{
          [`.${lineElementClasses.root}, .${markElementClasses.root}`]: {
            strokeWidth: 1,
          },
          '.MuiLineElement-series-p1Id': {
            stroke: 'rgb(92, 84, 237)',
            strokeWidth: '3px'
          },
          '.MuiLineElement-series-p2Id': {
            stroke: 'gray',
            strokeWidth: '3px'
          },
          '.MuiLineElement-series-pMaxId': {
            strokeDasharray: '3 4 5 2',
          },
          '.MuiLineElement-series-pMinId': {
            strokeDasharray: '3 4 5 2',
          },
          [`.${markElementClasses.root}:not(.${markElementClasses.highlighted})`]: {
            fill: '#fff',
          },
          [`& .${markElementClasses.highlighted}`]: {
            stroke: 'none',
          },
          [`.${axisClasses.root}`]: {
            [`.${axisClasses.tick}, .${axisClasses.line}`]: {
              stroke: 'rgb(32, 32, 32)',
            },
            // [`.${axisClasses.tickLabel}`]: {
            //   fill: 'color',
            // },
          },
        }}
        margin={margin}
        slotProps={{
          legend: {
            direction: 'horizontal',
            position: { 
              vertical: 'top',
              horizontal: 'center'
            },
            sx: {width: 'fit-content', margin: 'auto'}
          }
        }}
        onMarkClick={(event, id)=>{
          props.getDeptDataOnClick(id.seriesId, id.dataIndex)
        }}
        onAxisClick={(event, data)=>{
        }}
      />
    </ThemeProvider>
  )
}