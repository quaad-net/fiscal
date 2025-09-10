import { useState, useEffect } from 'react';

import Divider from '@mui/material/Divider';
import { purplePalette, pinkPaletteDark} from '@mui/x-charts/colorPalettes';
import AuxModal from './AuxModal';
import BasicLineChart from './BasicLineChart';
import FiscalDashedLineChart from './FiscalDashedLineChart';
import FiscalPieChart from './FiscalPieChart';
import { monthMap, reverseMonthMap } from '../../app/monthMaps';
import TinyLineChart from './TinyLineChart';
const proxyUrl = import.meta.env.VITE_PROXY_URL;

import './Fiscal.css';
import './Sidebar.css'

const curDate = new Date();
const curMoYr = `${curDate.toLocaleDateString().split('/')[0]}-${curDate.toLocaleDateString().split('/')[2]}`

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
    const [dataTable, setDataTable] = useState([]);
    const [historicalExpenditures, setHistoricalExpenditures] = useState([]);
    const [historicalRng, setHistoricalRng] = useState(0);
    const [mobileView, setMobileView] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [perctScenMod, setPerctScenMod] = useState(null);
    const [scenarioMod, setScenarioMod] = useState(false);
    const [sideBarActive, setSideBarActive]  = useState(null);
    const [topPurchases, setTopPurchases] = useState([]);

    // Line chart data
    const [lineChartData, setLineChartData] = useState([]);
    const [lineChartXLabels, setLineChartXLabels] = useState([]);
    const [p1Data, setP1Data] = useState([]);
    const [p2Data, setP2Data] = useState([]);
    const [p1Total, setP1Total] = useState(0);
    const [summary, setSummary] = useState({});

    // Pie chart data
    const [compareTo, setCompareTo] = useState(null);
    const [pieChartData, setPieChartData] = useState([]);
    const [pieChartColors, setPieChartColors] = useState(purplePalette);
    const [piePeriod, setPiePeriod] = useState('');
    const [pieMonth, setPieMonth] = useState('');

    // Delta Chart data
    const [deltaChartDataPM, setDeltaChartDataPM] = useState([]);
    const [deltaChartDataPY, setDeltaChartDataPY] = useState([]);
    const [deltaChartXLabels, setDeltaChartXLabels] = useState([]);
    const [deltaChartView, setDeltaChartView] = useState('PM');

    // Basic line chart data
    const [basicLineX, setBasicLineX] = useState([]);
    const [basicLineSeries, setBasicLineSeries] = useState([]);

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
        // ('Latest', 0, 0) => returns/analyzes entire period (p1) of data (instead of a specific month).
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
        if(scenarioMod){
            getDeptExpendituresbyMonth(period, month, moYr.split('-')[1], perctScenMod); 
            window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
        }
        else{
            getDeptExpendituresbyMonth(period, month, moYr.split('-')[1])
            window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
        }
    }

    function getDeptExpendituresbyMonth(period, month, year, perctMod){

        let mod, url, sign;
        if(perctMod){
            if(Number(perctMod)){mod = Number(perctMod)}
            else{throw new Error()}
        }
        if(mod == 0){ throw new Error()}
        else if(mod > 0 ){sign = 'pos'}
        else if(mod < 0){sign = 'neg'}
        if(perctMod){url =`${proxyUrl}/uwm-fs-expend/perct-mod-month=${month}&year=${year}&perctMod=${Math.abs(mod)}-${sign}`}
        else{url = `${proxyUrl}/uwm-fs-expend/month=${month}&year=${year}`}
        setPieChartData([]);

        fetch(url)
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
            if(perctMod){setScenarioMod(true); setPerctScenMod(perctMod)}
            else{setScenarioMod(false); setPerctScenMod(null)}
        })
        .catch((err)=>{console.log(err)})
    }

    function getExpenditures(perctMod){

            try{
                let mod, url, sign;
                if(perctMod){
                    if(Number(perctMod)){mod = Number(perctMod)}
                    else{throw new Error()}
                }
                if(mod == 0){ throw new Error()}
                else if(mod > 0 ){sign = 'pos'}
                else if(mod < 0){sign = 'neg'}
                if(perctMod){url =`${proxyUrl}/uwm-fs-expend/monthlyTtlsPerctMod=${Math.abs(mod)}-${sign}`}
                else{url = `${proxyUrl}/uwm-fs-expend/monthlyTtls`}
                document.querySelector('.sidebar-close').click();
                fetch(url)
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
                            rec.deltaCompPrevMo = NaN
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

                    // // Simple forecast for the current month (which is the next/latest month on the chart).
                    // // Uses last years data of the same month.
                    // const nextMoForecast = [];
                    // xLabels.forEach((val, idx)=>{
                    //     if(idx != xLabels.length - 1){
                    //         nextMoForecast.push(null)
                    //     }
                    //     else{
                    //         // Add the previous month's data.
                    //         nextMoForecast.push(p1DateVals[`${curMo-1}-${dt.getFullYear()}`])
                    //     }
                    // })
                    // if(p1DateVals[`${curMo}-${dt.getFullYear() - 1}`] != undefined){
                    //     nextMoForecast.push(p1DateVals[`${curMo}-${dt.getFullYear() - 1}`])
                    // }
                    // else if(p2DateVals[`${curMo}-${dt.getFullYear() - 1}`] != undefined){
                    //     nextMoForecast.push(p2DateVals[`${curMo}-${dt.getFullYear() - 1}`])
                    // }
                    // // Add forecast month
                    // xLabels.push(monthMap.get(curMo));
                
                    setLineChartData([
                        {data: maxData, label: 'max', id: 'pMaxId', color: 'brown', type: 'line', showMark: false},
                        {data: finalYrData, label: 'p1', color: 'rgb(92, 84, 237)', id: 'p1Id', type: 'line'}, 
                        {data: finalPrevYrData, label: 'p2', color: 'gray', id: 'p2Id', type: 'line'},
                        {data: minData, label: 'min', id: 'pMinId', color: 'rgb(255, 252, 252)', type: 'line', showMark: false},
                        // {data: nextMoForecast, label: 'forecast', id: 'fcId', color: 'lightcoral', type: 'line', showMark: false},
                    ]);
                    setLineChartXLabels(xLabels);

                    const dTbl = [...cur12];
                    // Sorts by month-year asceending.
                    dTbl.sort((a, b) => {
                        if((Number(a.moYr.split('-')[1]) != Number(b.moYr.split('-')[1]))){
                            if (Number(a.moYr.split('-')[1]) < Number(b.moYr.split('-')[1])) {
                                return -1;
                            }
                            if (Number(a.moYr.split('-')[1]) > Number(b.moYr.split('-')[1])) {
                                return 1;
                            }
                            return 0
                        }
                        else{
                            if (Number(a.moYr.split('-')[0]) < Number(b.moYr.split('-')[0])) {
                                return -1;
                            }
                            if (Number(a.moYr.split('-')[0]) > Number(b.moYr.split('-')[0])) {
                                return 1;
                            }
                            return 0
                        }
                    });
                    setDataTable(dTbl);
                    const delChtDataPM = [];
                    const delChtDataPY = [];
                    const delChtXLbls = [];
                    let p1Ttl = 0;
                    dTbl.map((val, idx)=>{
                        // Skips records where deltaPM has not been calculated or data is incomplete
                        // (located at start and end points of the graph).
                        if(idx == 1){
                            delChtDataPM.push(0);
                            delChtDataPY.push(0);
                            delChtXLbls.push(val.moYr);
                            p1Ttl += val.monthly_total;
                        }
                        else if(idx > 0 && idx != dTbl.length -1){
                            // deltaPM
                            if(Number(val.deltaCompPrevMo)){delChtDataPM.push(val.deltaCompPrevMo.toFixed(2))}
                            else{delChtDataPM.push(0)}
                            // deltaPY
                            if(Number(val.deltaCompPrevYrMo)){delChtDataPY.push(val.deltaCompPrevYrMo.toFixed(2))}
                            else{delChtDataPY.push(0)}
                            delChtXLbls.push(val.moYr)
                            p1Ttl += val.monthly_total;
                        }
                    })
                    setDeltaChartDataPM(delChtDataPM);
                    setDeltaChartDataPY(delChtDataPY);
                    setDeltaChartXLabels(delChtXLbls);
                    setP1Total(p1Ttl);
                    if(perctMod){setScenarioMod(true); setPerctScenMod(perctMod)}
                    else{setScenarioMod(false); setPerctScenMod(null)}
                    getPurchFreq();
                })
                .catch((err)=>{console.log(err)})
                }
            catch(err){
                console.log(err)
            }
    }

    async function getHistoricalExpenditures(years){
        try{
            if(historicalRng != years ){ // If true, a new range has been selected.
                fetch(`${proxyUrl}/uwm-fs-expend/purchase-historical-records`)
                .then((res)=>{return res.json()})
                .then((res)=>{
                    setModalContent(<></>);
                    const data = JSON.parse(res.data);
                    const earliestYear = new Date().toLocaleDateString().split('/')[2] - years;

                    const series=[{data: []}];

                    const xAxis = [{
                        scaleType: 'point', 
                        data: [],
                        valueFormatter: (value) => value.toString().slice(2),
                    }];
                    
                    data.map((d)=>{
                        if(d.year > earliestYear -1 ){
                            series[0].data.push(Number(d.ttl.toFixed(2)));
                            xAxis[0].data.push(d.year)
                        }
                    })

                    setBasicLineSeries(series);
                    setBasicLineX(xAxis);
                    setHistoricalExpenditures({series: series, xAxis: xAxis})

                    setModalContent(
                    <>
                        <BasicLineChart series={series} xAxis={xAxis} />
                        <div className='number-font' style={{textAlign: 'center', paddingBottom: 5}}>
                            ▫ Historical Data
                        </div>
                    </>
                    );
                    setModalOpen(true);
                    setHistoricalRng(years);
                })
            }
            else{ // Range has been set and hasn't changed.
                setModalContent(
                <>
                    <BasicLineChart series={historicalExpenditures.series} xAxis={historicalExpenditures.xAxis} />
                    <div className='number-font' style={{textAlign: 'center', paddingBottom: 5}}>
                        ▫ Historical Data
                    </div>
                </>
                );
                setModalOpen(true);
            }
        }
        catch(err){console.log(err)}
    }

    async function getPurchFreq(){
        try{
            const mostFreqPurchased = [];
            fetch(`${proxyUrl}/uwm-fs-expend/purchase-freq`)
            .then((res)=>{return res.json()})
            .then((res)=>{
                const data = JSON.parse(res.data);
                setTopPurchases(data);
            })
        }
        catch(err){console.log(err)}
    }

    async function getPurchHist(item_code){
        try{
            await fetch(`${proxyUrl}/uwm-fs-expend/purchase-hist=${item_code}`)
            .then((res)=>{return res.json()})
            .then((res)=>{
                setModalContent(<></>);
                const data = JSON.parse(res.data);
                const series=[
                    {
                    data: [],
                    // showMark: false,
                    },
                ];
                const xAxis = [];
                data.map((d, idx)=>{
                    series[0].data.push(Number(d.Unit_Cost.toFixed(2)));
                    xAxis.push(idx);
                })

                setBasicLineSeries(series);
                setBasicLineX(xAxis);
                setModalContent(
                <>
                    <BasicLineChart series={series} xAxis={xAxis} basicX={true} />
                    <div className='number-font' style={{textAlign: 'center', paddingBottom: 5}}>
                        {item_code} ▫ Unit Costs<br/> 
                        ▫ Latest to Right.
                    </div>
                </>
                );
                setModalOpen(true);
            })
        }
        catch(err){console.log(err)}
    }

    return(
        <>
        <div className="sidebar" style={{display: props.displaySidebar ? 'block' : 'none'}}>
            <span className="sidebar-close" onClick={()=>{props.setDisplaySidebar(false)}}>&times;</span>
            <div style={{marginLeft: '50px'}} className="logo-n-icon">
                <img className= "icon-logo" src='/icons8-us-dollar.svg' width='30px' />
                <div className="logo" style={{marginLeft: '5px'}}>Fiscal</div>
            </div> 
            <div className="divider"></div>
            <div className="sidebar-items">
                <div className="field">
                    <span id= "field-items">
                        <br/>
                        <div style={{width: 'fit-content', margin: 'auto'}}>
                            <img src='minimal-line-graph.svg' width='15px'/>&nbsp;&nbsp;Scenarios
                        </div>
                        <br/>
                        <div style={{width: 'fit-content', margin: 'auto'}}>
                            <div>
                                <div  
                                    style={{marginTop: '5px', color: 'gray'}}
                                >
                                    <div>
                                        <span 
                                            onClick={()=>{
                                                setLineChartData([]); 
                                                getExpenditures(-.05); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, -.05);
                                                setSideBarActive('-.05')
                                            }} 
                                            className={`number-font sidebar-data ${sideBarActive == '-.05' ? 'active' : ''}`}>↓5%
                                        </span>&nbsp;&nbsp;
                                        <span 
                                            onClick={()=>{
                                                setLineChartData([]); 
                                                getExpenditures(.05); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, .05);
                                                setSideBarActive('.05')
                                            }} 
                                            className={`number-font sidebar-data ${sideBarActive == '.05' ? 'active' : ''}`}>↑5%
                                        </span>
                                    </div>
                                    <Divider sx={{marginTop: '10px'}} color='rgb(22, 22, 22)'/>
                                    <div>
                                        <span
                                             onClick={()=>{setLineChartData([]); 
                                                getExpenditures(-.1); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, -.1);
                                                setSideBarActive('-.1')
                                            }} 
                                             className={`number-font sidebar-data ${sideBarActive == '-.1' ? 'active' : ''}`}>↓10%
                                        </span>&nbsp;&nbsp;
                                        <span 
                                            onClick={()=>{
                                                setLineChartData([]); 
                                                getExpenditures(.1); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, .1);
                                                setSideBarActive('.1')
                                            }} 
                                            className={`number-font sidebar-data ${sideBarActive == '.1' ? 'active' : ''}`}>↑10%
                                        </span>
                                    </div>
                                    <Divider sx={{marginTop: '10px'}} color='rgb(22, 22, 22)'/>
                                    <div>
                                        <span 
                                            onClick={()=>{
                                                setLineChartData([]); 
                                                getExpenditures(-.15); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, -.15);
                                                setSideBarActive('-.15')
                                            }} 
                                            className={`number-font sidebar-data ${sideBarActive == '-.15' ? 'active' : ''}`}>↓15%
                                        </span>&nbsp;&nbsp;
                                        <span 
                                            onClick={()=>{
                                                setLineChartData([]); 
                                                getExpenditures(.15); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, .15);
                                                setSideBarActive('.15')
                                            }} 
                                            className={`number-font sidebar-data ${sideBarActive == '.15' ? 'active' : ''}`}>↑15%
                                        </span>
                                    </div>
                                    <Divider sx={{marginTop: '10px'}} color='rgb(22, 22, 22)'/>
                                    <div>
                                        <span 
                                            onClick={()=>{
                                                setLineChartData([]); 
                                                getExpenditures(-.20); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, -.20);
                                                setSideBarActive('-.20')
                                            }} 
                                            className={`number-font sidebar-data ${sideBarActive == '-.20' ? 'active' : ''}`}>↓20%
                                        </span>&nbsp;&nbsp;
                                        <span 
                                            onClick={()=>{
                                                setLineChartData([]); 
                                                getExpenditures(.20); 
                                                getDeptExpendituresbyMonth('Latest', 0, 0, .20);
                                                setSideBarActive('.20')
                                            }} 
                                            className={`number-font sidebar-data ${sideBarActive == '.20' ? 'active' : ''}`}>↑20%
                                        </span>
                                    </div>
                                    <Divider sx={{marginTop: '10px'}} color='rgb(22, 22, 22)'/>
                                </div>
                            </div>
                        </div>
                    </span>
                    <br/>
                    {scenarioMod ? 
                    <>
                    <br/>
                    <button type="button" className='aux-btn' style={{marginLeft: '80px'}} onClick={()=>{
                        getExpenditures();
                        getDeptExpendituresbyMonth('Latest', 0, 0);
                        setSideBarActive('');
                    }}>Reset
                    </button>
                    <br/><br/><br/> 
                    </>
                    :
                    <></>
                    }
                    {topPurchases.length>0 ?
                        <div style={{width: 'fit-content', margin: 'auto', borderTop: '1px solid gray', paddingTop: 5}}>
                            <br/>
                            <div>
                                <img src='eye.svg' width='15px'/>&nbsp;&nbsp;Watchlist
                            </div>
                            <br/>
                            {topPurchases.map((d)=>{
                                const pc = d.Price_Chg
                                return(
                                    <div 
                                        key={d.PO_Item_Code}
                                        style={{marginBottom: 10}}
                                        className='action number-font'
                                        onClick={()=>{
                                            getPurchHist(d.PO_Item_Code)
                                        }}
                                        >
                                            ▫&nbsp;{d.PO_Item_Code}&nbsp;
                                            <span style={{color: 'white'}}>{Math.abs(pc) > .05 && pc< 0 ? '-' : ''  }</span>
                                            <span style={{color: 'red'}}>{Math.abs(pc) > .05 && pc > 0 ? '+' : ''  }</span>
                                    </div>

                                )
                            })}
                        </div>
                        :
                        <></>
                    }
                </div>
                <div>
                </div>
                <div className='hidden'></div >
            </div>
        </div>
        <div className="core-items">
        <div 
            style={{
                backgroundColor: 'rgb(22, 22, 22)', 
                borderRadius: '2px', 
                paddingTop: '5px', 
                paddingBottom: '50px', 
                paddingLeft: '10px', 
                paddingRight: '10px',
                minWidth: '275px',
                overflowX: 'auto',           
            }}
        >      
            <div className="main-title" style={{display:'flex', width: 'fit-content', marginLeft: 'auto', marginRight: 'auto'}}>
                <div 
                    style={{width: 'fit-content', flex: .1, padding: 5, margin: 5}}
                
                >
                    <button className='utility-btn'>
                            <img className="helper-icon" src= '/info.svg' width='25px' onClick={()=>{
                                setModalContent(
                                    <div>
                                        <div>
                                            <strong>p1</strong>: Most recent 11 month period. <br/>
                                            <strong>p2</strong>: Prior 11 month period.
                                        </div><br/>
                                        <div>
                                            <strong>ΔPM:</strong> Calculated based on the previous month. <br/><br/>
                                            <strong>ΔPY:</strong> Calculated based on the same month of the the previus year.
                                        </div><br/>
                                        <div>
                                            <strong>Scenarios:</strong> Recalculates data based on the chosen percentage increase or decrease <br/>
                                            of overall spending. Does not accumulate.
                                        </div><br/>
                                        <div>
                                            <i>
                                                Click any mark on the line graph 
                                                to view department data for the corresponding month.
                                            </i>
                                            <br/><br/>
                                        </div>
                                    </div>
                                )
                                setModalOpen(true);
                                }}/>
                    </button>
                    <div></div>
                    <button className='utility-btn' 
                        onClick={()=>{
                            setModalContent(
                                <div>
                                    <br/>
                                    <div><i>PO line items.</i></div><br/>
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
                            <img src='/spreadsheet.svg' width='25px' />
                    </button>
                </div>
                <div 
                    style={{
                        fontSize: 25, 
                        borderRadius: 5, 
                        borderLeft: '1px solid rgb(51, 51, 51)', 
                        borderRight: '1px solid rgb(51, 51, 51)', 
                        padding: 5, 
                        margin: 5, 
                        flex: .5}}
                >Expenditures
                    <div className="subtitle">Trailing 11 mo <span style={{color: 'gray'}}>{perctScenMod || ''}</span></div>
                </div>
                <div 
                    className='title-action' 
                    style={{fontSize: mobileView ? 12 : 15, borderRight: '1px solid rgb(51, 51, 51)', padding: 5, margin: 5, flex: .2}}
                    onClick={()=>{getHistoricalExpenditures(5)}}
                >
                    <span style={{color: 'whitesmoke'}}>Hist</span>
                    <div style={{color: 'lightcoral'}}>5 yr</div>
                </div>
                <div 
                    className='title-action' 
                    style={{fontSize: mobileView ? 12 : 15, borderRadius: 5, borderRight: '1px solid rgb(51, 51, 51)', padding: 5, margin: 5, flex: .2}}
                    onClick={()=>{getHistoricalExpenditures(10)}}
                >
                    <span style={{color: 'whitesmoke'}}>Hist</span>
                    <div style={{color: 'lightcoral'}}>10 yr</div>
                </div>
            </div>
            <div className="g1-container">
                <div className="g1" id="g1-1">
                    <div className= "g1-chart-container-1" style={{marginBottom: mobileView ? '50px' : '10px'}}>
                        <FiscalDashedLineChart lineChartData={lineChartData} xLabels={lineChartXLabels} getDeptDataOnClick={getDeptDataOnClick}/>
                    </div>
                    <div style={{
                        width: 'fit-content', 
                        marginLeft: 'auto', 
                        marginRight: 'auto',
                        marginBottom: '20px',
                        padding: '5px',
                        }}
                    >
                        <div style={{width: '100%', borderBottom: '1px solid rgb(51, 51, 51)'}}></div>
                        {mobileView ? <></>: <br/>}
                        {summary.min != undefined ? 
                        <>
                            <div style={{display: mobileView ? 'block' : 'flex'}}>
                                <div>
                                    {mobileView ? <br/>:<></>}
                                    <span style={{fontWeight: 'bold'}}>▫&nbsp;P1 Summary</span>
                                    <div style={{paddingLeft: '20px'}}>
                                        <div>total: <span className='number-font' style={{color: 'gray'}}>{p1Total.toFixed(2)}</span></div>
                                        <div>min: <span className='number-font' style={{color: 'gray'}}>{summary?.min.toFixed(2)}</span></div>
                                        <div>max: <span className='number-font' style={{color: 'gray'}}>{summary?.max.toFixed(2)}</span></div>
                                        <div>minΔPM:&nbsp;
                                            <span className='number-font' style={{color: 'gray'}}>{summary.minDeltaPM.moYr}</span> =&gt;&nbsp;
                                            <span className='number-font' style={{color: 'gray'}}>{summary.minDeltaPM.min.toFixed(2)}</span>
                                        </div>
                                        <div>minΔPY:&nbsp;
                                            <span className='number-font' style={{color: 'gray'}}>{summary.minDeltaPY.moYr}</span> =&gt;&nbsp;
                                            <span className='number-font' style={{color: 'gray'}}>{summary.minDeltaPY.min.toFixed(2)}</span>
                                        </div>
                                        <div>maxΔPM:&nbsp; 
                                            <span className='number-font'style={{color: 'gray'}}>{summary.maxDeltaPM.moYr}</span> =&gt;&nbsp; 
                                            <span className='number-font'style={{color: 'gray'}}>{summary.maxDeltaPM.max.toFixed(2)}</span>
                                        </div>
                                        <div>maxΔPY:&nbsp; 
                                            <span className='number-font' style={{color: 'gray'}}>{summary.maxDeltaPY.moYr}</span> =&gt;&nbsp; 
                                            <span className='number-font' style={{color: 'gray'}}>{summary.maxDeltaPY.max.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    {mobileView ? <div>&nbsp;</div> : <></>}
                                </div>
                                <div>
                                    <span style={{fontWeight: 'bold', paddingLeft: '20px'}}>▫&nbsp;
                                        DataTable
                                    </span>
                                    <div
                                        style={{
                                            paddingLeft: '20px', 
                                            maxHeight: '125px', 
                                            overflowY: 'auto', 
                                            msOverflowStyle: 'none', 
                                            scrollbarWidth: 'none', 
                                            '::WebkitScrollbar': {display: 'none'},
                                            marginTop: '3px',
                                            borderBottom: '1px dotted gray'
                                        }}
                                    >
                                        {dataTable.map((c, idx)=>{
                                            if(idx > 0 && idx != dataTable.length -1){
                                                return(
                                                    <div 
                                                        style={{paddingLeft: '20px'}}  
                                                        key={c.moYr} 
                                                    >
                                                        <div style={{marginBottom: '10px', marginTop: '5px'}} className='number-font'>
                                                            <span>○&nbsp;</span>
                                                            {c.moYr}: <span style={{color: 'gray'}}>{c.monthly_total.toFixed(2)}</span>
                                                            &nbsp;○ ΔPM: <span style={{color: 'gray'}}>{c.deltaCompPrevMo.toFixed(2)} </span>
                                                            &nbsp;○ ΔPY: <span style={{color: 'gray'}}>{c.deltaCompPrevYrMo.toFixed(2)} </span>
                                                        </div>
                                                        <Divider sx={{backgroundColor: 'gray'}}/>
                                                    </div>
                                                )
                                            }
                                        })}
                                    </div>
                                </div>
                                <div>
                                    {mobileView ? <div>&nbsp;</div> : <></>}
                                    <span style={{fontWeight: 'bold', paddingLeft: '20px'}}>▫&nbsp;
                                        Δ |
                                        <span 
                                            className='alter-view'
                                            onClick={()=>{setDeltaChartView('PM')}}
                                            style={{
                                                padding: '2px', margin: '1px', color: 'gray', fontWeight: 'normal',
                                                ...(deltaChartView == 'PM' ? {color: 'whitesmoke', textDecorationLine: 'underline'} : {color: 'gray'})
                                                }}
                                        >PM
                                        </span>
                                        <span 
                                            className='alter-view'
                                            onClick={()=>{setDeltaChartView('PY')}}
                                            style={{
                                                padding: '2px', margin: '1px', color: 'gray', fontWeight: 'normal',
                                                ...(deltaChartView == 'PY' ? {color: 'whitesmoke', textDecorationLine: 'underline'} : {color: 'gray'})
                                                }}
                                        >PY
                                        </span>
                                    </span>
                                    <div style={{marginLeft: '20px'}}>
                                        <TinyLineChart data={deltaChartView == 'PM' ? deltaChartDataPM : deltaChartDataPY} xLabels={deltaChartXLabels}/>
                                    </div>
                                </div>
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
                        <div style={{fontWeight: 'bold'}}>...</div>
                        <div className="subtitle">by Dept.</div><div style={{color: 'gray'}}><br/>
                        {pieMonth != ''  && pieChartData.length > 0 ?
                        <button type="button" className='aux-btn' onClick={()=>{
                            if(scenarioMod){getDeptExpendituresbyMonth('Latest', 0, 0, perctScenMod)}
                            else{getDeptExpendituresbyMonth('Latest', 0, 0)}
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
                                        Click any mark on the line graph 
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
                        <div style={{color: 'rgb(81, 81, 81)'}}>&nbsp;total &lt;desc&gt;| perct | ΔPM </div>
                        {
                            pieChartData.map((data, index)=>{
                                const [dept, deptPerct] = data.label.split(' ');
                                const delta = (( data.value - compareTo[dept]  ) / data.value).toFixed(2) ;
                                // Excludes departments outside of the top 8 in total expenditures.
                                if(index < 8 ){
                                    return(
                                        <span style={{color: 'gray'}} key={index}>
                                            <div className='field-value'><img src='/double-right-arrow.png' width='15px'/>{dept}</div>
                                            <div className='number-font'>{data.value.toFixed(2)} | {deptPerct} | {delta}</div>
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
        </div>
        <div className= "right-sidebar"></div>
        </>
    )
}