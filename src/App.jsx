import './App.css'
import Fiscal from './components/Fiscal';
import OptionsModal from './components/OptionsModal';
import Sidebar from './components/Sidebar';
import { useState } from 'react';

function App() {
  const [displaySidebar, setDisplaySidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [range, setRange] = useState(90); 


  return (
    <>
        <div className="mobile-header" style={{display: displaySidebar ? 'none': 'block'}}>
            <img className="mb-icon-logo" src="/us-dollar-sign.png" width='30px'/>
            <img className="mb-icon-menu" src="/icons8-whitemenu.svg" width='30px' onClick={()=>{setDisplaySidebar(true)}}/>
            <span className="header-tabs">
                <button type="button" className="mb-tab-btn" id="mb-tab-1" onClick={()=>{setOptionsModalOpen(true)}}>
                  <img src='/calendar-circled-date.svg' width='20px' />
                  {/* Range */}
                </button>
                {/* <button type="button" className="mb-tab-btn" id="mb-tab-2">Scenarios</button> */}
                {/* <button type="button" id="about-btn">About</button> */}
            </span>
        </div>
        <div className="core">
            <Sidebar displaySidebar={displaySidebar} setDisplaySidebar={setDisplaySidebar} />
            {/* block core_items */}
            <div className="core-items">
            {currentPage == 'Dashboard' ? <Fiscal/> : <></>}
            </div>
            {/* endblock core_items */}
            {/* Options Modal */}
            <OptionsModal modalOpen={optionsModalOpen} setModalOpen={setOptionsModalOpen} range={range} setRange={setRange} /> 
            {/* Aux Modal  */}
            <div className= "right-sidebar"></div>
        </div>
    </>
  )
}

export default App
