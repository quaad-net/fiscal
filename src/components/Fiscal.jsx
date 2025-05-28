import { purplePalette, bluePaletteDark, pinkPaletteDark} from '@mui/x-charts/colorPalettes';
import { useState, useEffect } from 'react';

import AuxModal from './AuxModal';
import FiscalDashedLineChart from './FiscalDashedLineChart';
import FiscalPieChart from './FiscalPieChart';
const proxyUrl = import.meta.env.VITE_PROXY_URL;

import './Fiscal.css';

const monthMap = new Map();
monthMap.set(1, 'jan')
monthMap.set(2, 'feb')
monthMap.set(3, 'mar')
monthMap.set(4, 'apr')
monthMap.set(5, 'may')
monthMap.set(6, 'jun')
monthMap.set(7, 'jul')
monthMap.set(8, 'aug')
monthMap.set(9, 'sep')
monthMap.set(10, 'oct')
monthMap.set(11, 'nov')
monthMap.set(12, 'dec')

const reverseMonthMap = new Map();
reverseMonthMap.set('jan', 1)
reverseMonthMap.set('feb', 2)
reverseMonthMap.set('mar', 3 )
reverseMonthMap.set('apr', 4)
reverseMonthMap.set('may', 5)
reverseMonthMap.set('jun', 6)
reverseMonthMap.set('jul', 7)
reverseMonthMap.set('aug', 8)
reverseMonthMap.set('sep', 9)
reverseMonthMap.set('oct', 10)
reverseMonthMap.set('nov', 11)
reverseMonthMap.set('dec', 12)

const download = (data, filename) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
}

function downloadDataset(tableName){
    fetch(`${proxyUrl}/get-dataset/${tableName}`)
    .then((res)=>{
       return res.json()
    })
    .then((res)=>{
        const data = JSON.parse(res.data);
        data.forEach((d)=>{
            const ordDate = d.Order_Date;
            const convertDate = new Date(ordDate);
            d.Order_Date = convertDate.toLocaleDateString()
        })
        const toCsv = jsonToCsv(data);
        download(toCsv, tableName);
    })
    .catch((err)=>{console.log(err)})
}

function jsonToCsv(jsonArray) {
    const headers = Object.keys(jsonArray[0]).join(',');
    const rows = jsonArray.map(obj => Object.values(obj).join(',')).join('\n');
    return `${headers}\n${rows}`;
}

export default function Fiscal(props){
    // Misc
    const [mobileView, setMobileView]= useState(false);
    const [modalContent, setModalContent] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    // Line chart data
    const [lineChartData, setLineChartData] = useState([]);
    const [lineChartXLabels, setLineChartXLabels] = useState([]);
    const [p1Data, setP1Data] = useState([]);
    const [p2Data, setP2Data] = useState([]);
    const [summary, setSummary] = useState({});

    // Pie chart data
    const [compareTo, setCompareTo] = useState(null);
    const [pieChartData, setPieChartData] = useState([]);
    const [pieChartColors, setPieChartColors] = useState(purplePalette);
    const [piePeriod, setPiePeriod] = useState('');
    const [pieMonth, setPieMonth] = useState('');

    useEffect(()=>{
        const atMedia = window.matchMedia("(max-width: 500px)");
        setMobileView(atMedia.matches);
        
        function updateMobileView(){
            setMobileView(atMedia.matches)
        }
        atMedia.addEventListener('change', updateMobileView);

        return function cleanup(){
            atMedia.removeEventListener('change', updateMobileView);
        }
    },[])

    useEffect(()=>{
        getExpenditures();
        // Note: ('Latest', 0, 0) => returns/analyzes entire period (p1) of data (instead of a specific month).
        getDeptExpendituresbyMonth('Latest', 0, 0)
    }, [])

    function getDeptDataOnClick(seriesId, dataIndex){
        // Gets proper month-year for query.
        const month = reverseMonthMap.get(lineChartXLabels[dataIndex]);
        let period;
        let moYr;
        if(seriesId == 'p1Id'){
            period = 'Latest';
            Object.keys(p1Data.dateVals).forEach((key)=>{
                if(key.split('-')[0] == month){moYr = key}
            })
        }
        else if(seriesId == 'p2Id'){
            period = 'Prior';
            Object.keys(p1Data.dateVals).forEach((key)=>{
                if(key.split('-')[0] == month){moYr = key}
            })
        }
        getDeptExpendituresbyMonth(period, month, moYr.split('-')[1])
    }

    function getDeptExpendituresbyMonth(period, month, year){

        setPieChartData([]);
        fetch(`${proxyUrl}/uwm-fs-expend/month=${month}&year=${year}`)
        .then((res)=>{
            if(res.status != 200){throw new Error()}
            return res.json()
        })
        .then((res)=>{
            const deptData = [], compareDeptTo = [];
            res.data.forEach((dataset)=>{
                const data = JSON.parse(dataset);
                for(const idx in data){
                    // If user is viewing 'Latest' period of data,
                    // the 'Prior' period of data is set into compareTo and vice versa.
                    if(period == 'Latest'){
                        if(Object.keys(data[idx]) == 'dept_totals_latest_12_mo'){
                            const deptTtls = data[idx].dept_totals_latest_12_mo;
                            deptTtls.forEach((dept)=>{
                            const deptRec = JSON.parse(dept);
                                deptData.push(deptRec[0])
                            })
                        }
                        else if(Object.keys(data[idx]) == 'dept_totals_earlier_12_mo'){
                            const deptTtls = data[idx].dept_totals_earlier_12_mo;
                            deptTtls.forEach((dept)=>{
                                const deptRec = JSON.parse(dept);
                                compareDeptTo.push(deptRec[0]);
                            })
                        }  
                    }
                    else if(period == 'Prior'){
                        if(Object.keys(data[idx]) == 'dept_totals_earlier_12_mo'){
                            const deptTtls = data[idx].dept_totals_earlier_12_mo;
                            deptTtls.forEach((dept)=>{
                            const deptRec = JSON.parse(dept);
                                deptData.push(deptRec[0]);
                            })
                        }  
                        else if(Object.keys(data[idx]) == 'dept_totals_latest_12_mo'){
                            const deptTtls = data[idx].dept_totals_latest_12_mo;
                            deptTtls.forEach((dept)=>{
                            const deptRec = JSON.parse(dept);
                                compareDeptTo.push(deptRec[0])
                            })
                        }
                                             
                    }
                }
            })
            // Used to calculate deltas.
            const addToCompare = {}
            compareDeptTo.forEach((dept)=>{
                addToCompare[Object.keys(dept)] = dept[Object.keys(dept)]
            })
            setCompareTo(addToCompare)

            const chartData = [];
            let totalExpend = 0;
            deptData.forEach((dept)=>{
                let value, key
                Object.keys(dept).forEach((k)=>{
                    key = k
                })
                Object.values(dept).forEach((v)=>{
                    value = v
                    totalExpend += v
                })
                chartData.push({label: key, value: value})
            })
            chartData.forEach((obj)=>{
                obj.label += ` ` + ((obj.value / totalExpend) * 100).toFixed(2).toString() + '%'
            })

            const removeZeroPerct = [];
            chartData.forEach((obj)=>{
                if(Number(obj.value).toFixed(2) != 0.00){removeZeroPerct.push(obj)}
            })

            const items = [...removeZeroPerct]
            items.sort((b, a) => {
                const item1 = a.value;
                const item2 = b.value;
                if(item1 !== item2){
                    if (item1 < item2) {
                    return -1;
                    }
                    if (item1 > item2) {
                    return 1;
                    }
                    return 0;
                }
                else{
                    const item3 = a.label;
                    const item4 = b.label;

                    if (item3 < item4) {
                    return -1;
                    }
                    if (item3 > item4) {
                    return 1;
                    }
                    return 0;
                }
            })

            setPieChartData(items);
            if(period == 'Latest'){
                setPieChartColors(purplePalette)
                setPiePeriod('P1')
                if(month != 0){setPieMonth(month)}
                else{setPieMonth('')}
            }
            else if(period == 'Prior'){
                setPieChartColors(pinkPaletteDark)
                setPiePeriod('P2')
                if(month != 0){setPieMonth(month)}
                else{setPieMonth('')}
            }
            
        })
        .catch((err)=>{console.log(err)})
    }

    function getExpenditures(){
            fetch(`${proxyUrl}/uwm-fs-expend/monthly-totals-with-prev-yr`
            )
            .then((res)=>{
                if(res.status != 200){ throw new Error()}
                return res.json()
            })
            .then((res)=>{
                const cur12 = JSON.parse(res.data[0]);
                const prev12 = JSON.parse(res.data[1]);
                const dt = new Date();
                const monthsOrd = [];   // {Month, Year}
                const monthsArr = [];  // Array of numeric values of months only.

                // Get correct ordering of months based on the current month.
                const dtStr = dt.toLocaleString();
                let mo = Number(dtStr.split(' ')[0].split('/')[0]);
                let year = dt.getFullYear();
                for (let i = 1 ; i  < 13; i++){
                    monthsOrd.push({mo: mo, yr: year});
                    monthsArr.push(mo);
                    mo -= 1
                    if(mo == 0){
                        mo = 12;
                        year = year - 1;
                    }
                }
                const cur12Map = new Map();
                const prev12Map = new Map();
                const yearsCur = [];
                const yearsPrev = [];

                // Set data
                for(const mIdx in monthsOrd){
                    for(const idx in cur12){
                        const curMonth = cur12[idx].moYr.split("-")[0]
                        const curYear = cur12[idx].moYr.split("-")[1]
                        if(curMonth == monthsOrd[mIdx].mo && curYear == monthsOrd[mIdx].yr){
                            cur12Map.set(cur12[idx].moYr, cur12[idx].monthly_total.toFixed(2))
                            yearsCur.push(cur12[idx].moYr.split("-")[1])
                        }
                    }
                    for(const idx in prev12){
                        const prevMonth = prev12[idx].moYr.split("-")[0]
                        const prevYear = prev12[idx].moYr.split("-")[1]
                        if(prevMonth == monthsOrd[mIdx].mo && prevYear == monthsOrd[mIdx].yr - 1){
                            prev12Map.set(prev12[idx].moYr, prev12[idx].monthly_total.toFixed(2))
                            yearsPrev.push(prev12[idx].moYr.split("-")[1])
                        }
                    }
                }
                
                const finalYrData = [];
                const finalPrevYrData = [];
                const xLabels = [];
                const compareCurrent = Number(dtStr.split(' ')[0].split('/')[0]);
                let currYrC = Number(yearsCur.sort((a, b)=> a - b)[0]); // The last year for the curent year (12 month period) of data.
                let currYrP = Number(yearsPrev.sort((a, b)=> a - b)[0]); // The last year for the previous year (12 month period) of data.
                const earliestMonth = monthsArr[monthsArr.length - 1];
                let currMo = earliestMonth;
                // Set data in array from earliest date to latest.
                monthsOrd.forEach(()=>{
                    if(currMo != compareCurrent){
                        finalYrData.push(cur12Map.get(`${currMo}-${currYrC}`));
                        finalPrevYrData.push(prev12Map.get(`${currMo}-${currYrP}`));
                        xLabels.push(monthMap.get(currMo));
                    }
                    currMo += 1;
                    // The following year's data (which is the current year).
                    if(currMo == 13){
                        currMo = 1;
                        currYrC += 1;
                        currYrP += 1;
                    }
                })

                // Add deltas to cur12.
                const curMonth = Number(dt.toLocaleString().split('/')[0])
                cur12.forEach((rec)=>{
                    const [month, year] = rec.moYr.split('-');
                    const prevYrMoTtl = prev12Map.get(`${month}-${year-1}`);
                    const prevMoTtl = cur12Map.get(`${month -1}-${year}`);
                    rec.deltaCompPrevYrMo  = (rec.monthly_total - prevYrMoTtl) / prevYrMoTtl
                    // The following conditions allow wrapping around to prior period of data in order to calculate
                    // delta using the previous month's data.
                    if(month == 1){
                        // Gets December's data.
                        if(prev12Map.get(`12-${year - 1}`) != undefined){
                            rec.deltaCompPrevMo = (rec.monthly_total - prev12Map.get(`12-${year - 1}`)) / prev12Map.get(`12-${year - 1}`)
                        }
                        else if(cur12Map.get(`12-${year - 1}`) != undefined){
                            rec.deltaCompPrevMo = (rec.monthly_total - cur12Map.get(`12-${year - 1}`)) / cur12Map.get(`12-${year - 1}`)
                        }
                    }
                    else if(month - 1 == curMonth){
                        // Due to current month-year of data being incomplete, this calculation will not be used 
                        // when comparing highest/lowest deltas.
                        const prevMoPeriodPrior = prev12Map.get(`${month - 1}-${year}`)
                        rec.deltaCompPrevMo = (rec.monthly_total - prevMoPeriodPrior) / prevMoPeriodPrior
                    }
                    else{rec.deltaCompPrevMo = (rec.monthly_total - prevMoTtl) / prevMoTtl}
                })

                // Min Delta when calculating delta by previous month.
                const minDeltaCompPrevMo = [...cur12];
                minDeltaCompPrevMo.sort((a, b) => {
                    if (Math.abs(a.deltaCompPrevMo) < Math.abs(b.deltaCompPrevMo)) {
                        return -1;
                    }
                    if (Math.abs(a.deltaCompPrevMo) > Math.abs(b.deltaCompPrevMo)) {
                        return 1;
                    }
                    return 0;
                });
                // Ignores current and next month when getting min/max deltas.
                let minDeltaPMIdx = 0;
                let minDeltaPMRec = minDeltaCompPrevMo[minDeltaPMIdx].moYr.split('-')[0]
                while(
                    minDeltaPMRec == curMonth + 1 || 
                    minDeltaPMRec == curMonth 
                    )
                {
                    minDeltaPMIdx++;
                    minDeltaPMRec = minDeltaCompPrevMo[minDeltaPMIdx].moYr.split('-')[0]
                }
                const minDeltaPM = {
                    min: minDeltaCompPrevMo[minDeltaPMIdx].deltaCompPrevMo,
                    moYr: minDeltaCompPrevMo[minDeltaPMIdx].moYr
                };
                
                // Min Delta when calculating delta by previous year of same month.
                const minDeltaCompPrevYrMo  = [...cur12];
                minDeltaCompPrevYrMo.sort((a, b) => {
                    if (Math.abs(a.deltaCompPrevYrMo) < Math.abs(b.deltaCompPrevYrMo)) {
                        return -1;
                    }
                    if (Math.abs(a.deltaCompPrevYrMo) > Math.abs(b.deltaCompPrevYrMo)) {
                        return 1;
                    }
                    return 0;
                });
                // Ignores current and next month when getting min/max deltas.
                let minDeltaPYIdx = 0;
                let minDeltaPYRec = minDeltaCompPrevYrMo[minDeltaPYIdx].moYr.split('-')[0]
                while(
                    minDeltaPYRec == curMonth + 1 || 
                    minDeltaPYRec == curMonth 
                    )
                {
                    minDeltaPYIdx++;
                    minDeltaPYRec = minDeltaCompPrevYrMo[minDeltaPYIdx].moYr.split('-')[0]
                }
                const minDeltaPY = {
                    min: minDeltaCompPrevYrMo[minDeltaPYIdx].deltaCompPrevYrMo, 
                    moYr: minDeltaCompPrevYrMo[minDeltaPYIdx].moYr
                };

                // Max Delta when calculating delta by previous month.
                const maxDeltaCompPrevMo = [...cur12];
                maxDeltaCompPrevMo.sort((a, b) => {
                    if (Math.abs(a.deltaCompPrevMo) < Math.abs(b.deltaCompPrevMo)) {
                        return 1;
                    }
                    if (Math.abs(a.deltaCompPrevMo) > Math.abs(b.deltaCompPrevMo)) {
                        return -1;
                    }
                    return 0;
                });
                // Ignores current and next month when getting min/max deltas.
                let maxDeltaPMIdx = 0;
                let maxDeltaPMRec = maxDeltaCompPrevMo[maxDeltaPMIdx].moYr.split('-')[0]
                while(
                    maxDeltaPMRec == curMonth + 1 || 
                    maxDeltaPMRec == curMonth 
                    )
                {
                    maxDeltaPMIdx++;
                    maxDeltaPMRec = maxDeltaCompPrevMo[maxDeltaPMIdx].moYr.split('-')[0]
                }
                const maxDeltaPM = {
                    max: maxDeltaCompPrevMo[maxDeltaPMIdx].deltaCompPrevMo, 
                    moYr: maxDeltaCompPrevMo[maxDeltaPMIdx].moYr
                };

                // Max Delta when calculating delta by previous year of same month.
                const maxDeltaCompPrevYrMo  = [...cur12];
                maxDeltaCompPrevYrMo.sort((a, b) => {
                    if (Math.abs(a.deltaCompPrevYrMo) < Math.abs(b.deltaCompPrevYrMo)) {
                        return 1;
                    }
                    if (Math.abs(a.deltaCompPrevYrMo) > Math.abs(b.deltaCompPrevYrMo)) {
                        return -1;
                    }
                    return 0;
                });
                // Ignores current and next month when getting min/max deltas.
                let maxDeltaPYIdx = 0;
                let maxDeltaPYRec = maxDeltaCompPrevYrMo[maxDeltaPYIdx].moYr.split('-')[0]
                while(
                    maxDeltaPYRec == curMonth + 1 || 
                    maxDeltaPYRec == curMonth 
                    )
                {
                    maxDeltaPYIdx++;
                    maxDeltaPYRec = maxDeltaCompPrevYrMo[maxDeltaPYIdx].moYr.split('-')[0]
                }
                const maxDeltaPY = {
                    max: maxDeltaCompPrevYrMo[maxDeltaPYIdx].deltaCompPrevYrMo,
                    moYr: maxDeltaCompPrevYrMo[maxDeltaPYIdx].moYr
                };

                // Items for sidebar
                const items = [...cur12];
                items.sort((a, b) => {
                    if (a.monthly_total < b.monthly_total) {
                        return 1;
                    }
                    if (a.monthly_total > b.monthly_total) {
                        return -1;
                    }
                    return 0;
                });
                props.setSideBarContent(items)

                const items2 = [...prev12];
                items2.sort((a, b) => {
                    if (a.monthly_total < b.monthly_total) {
                        return 1;
                    }
                    if (a.monthly_total > b.monthly_total) {
                        return -1;
                    }
                    return 0;
                });
                
                let cur12max = 0, prev12max = 0, cur12min = 0, prev12min = 0;
                const curMo = Number(dt.toLocaleString().split('/')[0])
                // Get min, max for latest period of data.
                items.forEach((item)=>{
                    if(Number(item.moYr.split('-')[0]) != curMo){
                        if(item.monthly_total > cur12max){cur12max = item.monthly_total};
                    }
                })
                cur12min = cur12max;
                items.forEach((item)=>{
                    if(Number(item.moYr.split('-')[0]) != curMo){
                        if(item.monthly_total < cur12min){cur12min = item.monthly_total};
                    }
                })
                // Get min, max for earlier period of data.
                items2.forEach((item)=>{
                    if(Number(item.moYr.split('-')[0]) != curMo){
                        if(item.monthly_total > prev12max){prev12max = item.monthly_total};
                    }
                })
                prev12min = prev12max;
                items2.forEach((item)=>{
                    if(Number(item.moYr.split('-')[0]) != curMo){
                        if(item.monthly_total < cur12min){cur12min = item.monthly_total};
                    }
                })

                function getMinMax(){
                    const minMax = {}
                    // Returns the max and min values in either period. 
                    switch(cur12max > prev12max){
                        case true:
                            minMax.max = cur12max
                            break
                        case false:
                            minMax.max = prev12max
                            break
                        default: 
                            minMax.max = cur12max
                    }
                    switch(cur12min > prev12min ){
                        case true:
                            minMax.min = prev12min
                            break
                        case false:
                            minMax.min = cur12min
                            break
                        default:
                            minMax.mix = cur12min
                    }
                    return minMax
                }

                // Used to create min max lines
                const minMax = getMinMax();
                const minData = [], maxData = [];
                finalPrevYrData.forEach((d)=>{
                    minData.push(minMax.min);
                    maxData.push(minMax.max);
                })

                const analysis = {
                    min: minMax.min,
                    max: minMax.max,
                    minDeltaPM,
                    maxDeltaPM,
                    minDeltaPY,
                    maxDeltaPY
                } 
                setSummary(analysis);

                // Used to access data by obj['month-year']
                const p1DateVals = {};
                for(const idx in cur12){
                    p1DateVals[cur12[idx].moYr] = cur12[idx].monthly_total
                }
                const p2DateVals = {};
                for(const idx in prev12){
                    p2DateVals[prev12[idx].moYr] = prev12[idx].monthly_total
                }
                setP1Data({dateVals: p1DateVals});
                setP2Data({dateVals: p2DateVals});

                setLineChartData([
                    {data: maxData, label: 'max', id: 'pMaxId', color: 'lightcoral', type: 'line', showMark: false},
                    {data: finalYrData, label: 'p1', color: 'rgb(92, 84, 237)', id: 'p1Id', type: 'line'}, 
                    {data: finalPrevYrData, label: 'p2', color: 'gray', id: 'p2Id', type: 'line'},
                    {data: minData, label: 'min', id: 'pMinId', color: 'rgb(255, 252, 252)', type: 'line', showMark: false},
                ]);
                setLineChartXLabels(xLabels);
            })
            .catch((err)=>{console.log(err)})
    }

    return(
        <div 
            style={{
                backgroundColor: 'rgb(22, 22, 22)', 
                borderRadius: '2px', 
                paddingTop: '5px', 
                paddingBottom: '100px', 
                paddingLeft: '10px', 
                paddingRight: '10px',
                minWidth: '275px',
                overflowX: 'auto'    
            }}
        >      
            <div className="main-title" style={{marginLeft: 0, paddingLeft: 0}}>
                <img src='/fiscal-calendar.svg' width='35px'/>
                <div>Expenditures</div>
                <div className="subtitle">11-mo</div>
            </div>
            {mobileView ? <></> : <div>--</div>} 
            <div style={{float: 'left'}}>
                <button className='utility-btn'>
                        <img className="helper-icon" src= '/info.svg' width='25px' onClick={()=>{
                            setModalContent(
                                <div>
                                    <div>
                                        <strong>p1</strong>: Most recent 11 month period. <br/>
                                        <strong>p2</strong>: Prior 11 month period.
                                    </div><br/><br/>
                                    <div>
                                        <strong>deltaPM:</strong> Calculated based on the previous month. <br/>
                                        <strong>deltaPY:</strong> Calculated based on the same month of the the previus year.
                                    </div><br/><br/>
                                    <div>
                                        <i>
                                            Click any mark on the either line on the line graph 
                                            to view department data for the corresponding month.
                                        </i>
                                    </div>
                                </div>
                            )
                            setModalOpen(true);
                            }}/>
                </button><br/>
                <button className='utility-btn' 
                    onClick={()=>{
                        setModalContent(
                            <div>
                                <div style={{marginBottom:'5px', marginTop: '5px'}}><strong>p1</strong>=&gt; 
                                    <span className='download' style={{color: 'rgb(83, 83, 245)'}}
                                        onClick={()=>{downloadDataset('uwm_purchaseHist12Mo')}}
                                    >&nbsp;&nbsp;Download CSV&nbsp;
                                    </span>
                                </div>
                                <div><strong>p2</strong>=&gt;
                                    <span className='download' style={{color: 'rgb(83, 83, 245)'}}
                                        onClick={()=>{downloadDataset('uwm_purchaseHistLt732Gt365')}}
                                    >&nbsp;Download CSV&nbsp;
                                    </span>
                                </div>
                            </div>
                        )
                        setModalOpen(true);
                    }}
                >
                        <img src='/grid.svg' width='25px' />
                </button>
            </div>
            <br/>
            <div className="g1-container">
                <div className="g1" id="g1-1">
                    <div className= "g1-chart-container-1" style={{marginBottom: mobileView ? '50px' : '10px', marginTop: '50px'}}>
                        <FiscalDashedLineChart lineChartData={lineChartData} xLabels={lineChartXLabels} getDeptDataOnClick={getDeptDataOnClick}/>
                    </div>
                    <div style={{
                        width: 'fit-content', 
                        margin: 'auto', 
                        marginBottom: '20px',
                        padding: '5px', 
                        borderRadius: '5px'
                        }}
                    >
                        {summary.min != undefined ?
                        <>
                            <span style={{fontWeight: 'bold'}}>▫&nbsp;Summary</span>
                            <div style={{paddingLeft: '20px'}}>
                                <div>min: <span style={{color: 'gray'}}>{summary?.min.toFixed(2)}</span></div>
                                <div>max: <span style={{color: 'gray'}}>{summary?.max.toFixed(2)}</span></div>
                                <div>minDeltaPM: <span style={{color: 'gray'}}>{summary.minDeltaPM.moYr}</span> =&gt; <span style={{color: 'gray'}}>{summary.minDeltaPM.min.toFixed(2)}</span></div>
                                <div>minDeltaPY: <span style={{color: 'gray'}}>{summary.minDeltaPY.moYr}</span> =&gt; <span style={{color: 'gray'}}>{summary.minDeltaPY.min.toFixed(2)}</span></div>
                                <div>maxDeltaPM: <span style={{color: 'gray'}}>{summary.maxDeltaPM.moYr}</span> =&gt; <span style={{color: 'gray'}}>{summary.maxDeltaPM.max.toFixed(2)}</span></div>
                                <div>maxDeltaPY: <span style={{color: 'gray'}}>{summary.maxDeltaPY.moYr}</span> =&gt; <span style={{color: 'gray'}}>{summary.maxDeltaPY.max.toFixed(2)}</span></div>
                            </div>
                        </>
                        :
                        <></>
                        }
                    </div>
                </div>
            </div>
            <div className="g2-container">
                <div className="g2-header">
                    <div className="g2-header-items">
                        <img src='/department.svg' width='35px' {...(mobileView ? {style: {float: 'right'}} : {})}/>
                        <div style={{fontWeight: 'bold'}}>...</div>
                        <div className="subtitle">by Dept.</div><div style={{color: 'gray'}}><br/>
                        {pieMonth != ''  && pieChartData.length > 0 ?
                        <button type="button" className='aux-btn' onClick={()=>{
                            getDeptExpendituresbyMonth('Latest', 0, 0)
                        }}>Reset
                        </button>
                        :
                        <></>
                        }
                        </div>
                        
                    </div>
                </div>
                <div className= "g2-1"> 
                    <div className="g2-1-chart-container">
                        <div id="g2-1-chart">
                            <div {...(!mobileView ? {style: {marginBottom: '30px'}} : {} )}></div>
                            <FiscalPieChart 
                                colors={pieChartColors} 
                                data={pieChartData} 
                                size={{
                                    width: mobileView ? 300 : 300, 
                                    height: mobileView ? 300 : 300
                                }} 
                                {...(pieChartData.length > 1 ? 
                                    {centerLabel: `${piePeriod} ${monthMap.get(pieMonth) == undefined ? '' : monthMap.get(pieMonth)}`} 
                                    : 
                                    {}
                                )}
                            />
                        </div>
                    </div>
                </div>
                <div style={{marginTop: '30px'}}></div>
                <div className="g2-2">
                    <div className="g2-2-items">
                        <button className='utility-btn'>
                            <img className="helper-icon" id="hlpr-g2-2" src= '/info.svg' width='25px' onClick={()=>{
                                setModalContent(
                                    <i>
                                        Click any mark on the either line on the line graph 
                                        to view department data for the corresponding month.
                                    </i>
                                )
                                setModalOpen(true);
                                }}
                            />
                        </button>
                        <div id="g2-2-title"></div>
                        <div className="subtitle mobile-desktop" id="g2-2-subtitle">Dept. Details</div>
                    </div>
                </div>
                <div className="g2-2-table">
                    {pieChartData.length > 0 ?
                    <>
                        <div style={{color: 'rgb(81, 81, 81)'}}>&nbsp;total | perct &lt;desc&gt;| deltaPM </div>
                        {
                            pieChartData.map((data, index)=>{
                                const [dept, deptPerct] = data.label.split(' ');
                                const delta = (( data.value - compareTo[dept]  ) / data.value).toFixed(2) ;
                                if(index < 8 ){
                                    return(
                                        <span style={{color: 'gray'}} key={index}>
                                            <div className='field-value'><img src='/tree-structure.png' width='15px'/>{dept}</div>
                                            <div>{data.value.toFixed(2)} | {deptPerct} | {delta}</div>
                                        </span>
                                    )
                                }
                                else if(index == 9){
                                    return(
                                        <div key={index}>...</div>
                                    )
                                }
                            })
                        }
                    </>
                    :
                    <>
                        <div style={{all: 'unset', textAlign: 'center', paddingTop: '140px',fontSize: '50px', border: 'none'}}>!</div>
                    </>
                    }
                </div>
            </div>
            <AuxModal modalOpen={modalOpen} setModalOpen={setModalOpen} modalContent={modalContent}/>
        </div>
    )
}