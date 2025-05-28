import { useState } from 'react';

import Fiscal from './components/Fiscal';
import Sidebar from './components/Sidebar';

import './App.css'

function App() {
  const [displaySidebar, setDisplaySidebar] = useState(false);
  const [sideBarContent, setSideBarContent] = useState([]);

  return (
    <>
        <div className="mobile-header" style={{display: displaySidebar ? 'none': 'block'}}>
            <img className="mb-icon-logo" src="/us-dollar-sign.png" width='30px'/>
            <img className="mb-icon-menu" src="/icons8-whitemenu.svg" width='30px' onClick={()=>{setDisplaySidebar(true)}}/>
            <span className="header-tabs">
            </span>
        </div>
        <div className="core">
            <Sidebar displaySidebar={displaySidebar} setDisplaySidebar={setDisplaySidebar} content={sideBarContent}/>
            <div className="core-items">
              <Fiscal setSideBarContent={setSideBarContent}/>
            </div>
            <div className= "right-sidebar"></div>
        </div>
    </>
  )
}

export default App
