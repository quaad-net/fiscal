
import AuxModal from './AuxModal';
import { useState } from 'react';
import './Fiscal.css';

export default function Fiscal(){
    const [modalOpen, setModalOpen] = useState(false)
    

    return(
        <>
            <div className="main-title"><br/>Expenditures<br/>
                <div className="subtitle">Ninety-Day</div>
            </div>
            <div className="g1-container">
                <div className="g1" id="g1-1">
                    <img className="helper-icon" id="hlpr-g1-1" src= '/icons8-help.svg' width='25px' onClick={()=>{setModalOpen(true)}}/>
                    <div className= "g1-chart-container-1">
                        <canvas id="g1-chart"></canvas>
                    </div>
                </div>
                <div className="g1" id="g1-2">
                    <img className="helper-icon" id="hlpr-g1-2" src= '/icons8-help.svg' width='25px'/>
                    <div className= "g1-chart-container-2">
                        <canvas id="g2-chart"></canvas>
                    </div>
                </div>
            </div>
            <div className="g2-container">
                <div className="g2-header">
                    <div className="g2-header-items">
                        <div style={{fontWeight: 'bold'}}>...</div>
                        <div className="subtitle">by Dept</div>
                        {/* <button type="button" className="title-btn" id= "tb1">Range</button> */}
                    </div>
                </div>
                <div className= "g2-1"> 
                    <div className="g2-1-chart-container">
                        <canvas id="g2-1-chart"></canvas>
                    </div>
                </div>
                <div className="g2-2">
                    <div className="g2-2-items">
                        <img className="helper-icon" id="hlpr-g2-2" src= '/icons8-help.svg' width='25px' />
                        <div id="g2-2-title"></div>
                        <div className="subtitle" id="g2-2-subtitle">Dept Details</div>
                    </div>
                </div>
                <div className="g2-2-table">
                    <div>Field</div>
                    <div className='field-value'>Field Value</div>
                </div>
            </div>
            <div className="g2-3">
                <div className="g2-3-title">
                    <div>Budget<br/>Scenarios<br/><br/></div>
                    <img className="helper-icon" id="hlpr-g2-3" src= '/icons8-help.svg' width='25px' />
                </div>
                <div className="g2-3-chart-container">
                    <canvas id="g2-3-chart"></canvas>
                </div>
            </div>
            <div className="additional-data">
                <div className="additional-data-title">Datasets<br/><br/>
                    <img className="helper-icon" id="hlpr-additional-data" src= '/icons8-help.svg' width='25px' />
                </div>
                <div className="additional-data-data-groups">
                    <div className="additional-data-group-1">
                        <div className="additional-data-group" id="ad-1-1">Stores</div>
                        <div className="additional-data-group" id="ad-1-2">Mech</div>
                    </div>
                    <div className="additional-data-group-2">
                        <div className="additional-data-group" id="ad-2-1">Plumb</div>
                        <div className="additional-data-group" id="ad-2-2">Electrical</div>
                        <div className="additional-data-group" id="ad-2-3">All</div>
                    </div>
                </div>
            </div>
            <AuxModal modalOpen={modalOpen} setModalOpen={setModalOpen}/>
        </>
    )
}