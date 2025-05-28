import {createTheme, ThemeProvider} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';

const StyledText = styled('text')(({ theme }) => ({
  fill: theme.palette.text.primary,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fontSize: 20,
}));

function PieCenterLabel({ children }) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <StyledText x={left + width / 2} y={top + height / 2}>
      {children}
    </StyledText>
  );
}

const darkTheme = createTheme({
    palette: {
    mode: 'dark',
    },
});

export default function FiscalPieChart(props) {

  return (
    <ThemeProvider theme={darkTheme}>
        <PieChart 
          loading={props.data.length == 0} 
          hideLegend colors={props.colors} 
          series={[{ data: props.data, innerRadius: 120, paddingAngle: 0}]} 
          {...props.size} 
        >
        <PieCenterLabel>{props.centerLabel}</PieCenterLabel>
        </PieChart>
    </ThemeProvider>
  );
}