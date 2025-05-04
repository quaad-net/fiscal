import './Sidebar.css'

export default function Sidebar(props){

    return(
        <div className="sidebar" style={{display: props.displaySidebar ? 'block' : 'none'}}>
            <span className="sidebar-close" onClick={()=>{props.setDisplaySidebar(false)}}>&times;</span>
            <div style={{marginLeft: '25px'}} className="logo-n-icon">
                <img className= "icon-logo" src='/icons8-us-dollar.svg' width='30px' />
                <div className="logo" style={{marginLeft: '5px'}}>Fiscal</div>
            </div> 
            <div className="divider"></div>
            {/* block sidebar_items */}
            <div className="sidebar-items">
                <div className="field">
                    <span id= "field-items">
                        {/* <div className="textInputWrapper">
                            <input id="input-1" placeholder="input" type="text" className="textInput" maxLength="4"/>
                        </div>
                        <div className="textInputWrapper">
                            <input id="input-2" placeholder="input" type="text" className="textInput" maxLength="4"/>
                        </div> */}
                    </span>
                </div>
                <div>
                    {/* <button type ="button" id= "qryBtn">Search</button> */}
                </div>
                <div className='hidden'></div >
            </div>
            {/* endblock sidebar_items */}
        </div>
    )
}