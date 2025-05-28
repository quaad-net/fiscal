import Divider from '@mui/material/Divider';
import './Sidebar.css'

const dt = new Date();
const moYr = `${dt.toLocaleDateString().split('/')[0]}-${dt.toLocaleDateString().split('/')[2]}`

export default function Sidebar(props){

    return(
        <div className="sidebar" style={{display: props.displaySidebar ? 'block' : 'none'}}>
            <span className="sidebar-close" onClick={()=>{props.setDisplaySidebar(false)}}>&times;</span>
            <div style={{marginLeft: '25px'}} className="logo-n-icon">
                <img className= "icon-logo" src='/icons8-us-dollar.svg' width='30px' />
                <div className="logo" style={{marginLeft: '5px'}}>Fiscal</div>
            </div> 
            <div className="divider"></div>
            <div className="sidebar-items">
                <div className="field">
                    <span id= "field-items">
                        <br/>
                        <div style={{width: 'fit-content', margin: 'auto', color: 'gray'}}>
                            <img src='minimal-line-graph.svg' width='25px'/> P1 | Totals | Desc 
                        </div>
                        <br/>
                        <div style={{width: 'fit-content', margin: 'auto'}}>
                            {props.content.map((c, idx)=>{
                                if(c.moYr !== moYr){
                                    return(
                                        <div  
                                            className='sidebar-data'
                                            key={c.moYr} 
                                            style={{marginTop: '5px'}}>
                                            <div >
                                                {idx == 0 ? <span style={{color: 'white'}}>-&nbsp;</span> : <span style={{color: 'white'}}>ˇ&nbsp;</span>}
                                                {c.moYr} | {c.monthly_total.toFixed(2)}
                                            </div>
                                            <Divider sx={{marginTop: '5px'}} color='rgb(22, 22, 22)'/>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    </span>
                    <br/>
                    {/* <div className="textInputWrapper">
                            <input id="input-1" placeholder="input" type="text" className="textInput" maxLength="4" style={{textAlign: 'center'}}/>
                        </div>
                        <div className="textInputWrapper">
                            <input id="input-2" placeholder="input" type="text" className="textInput" maxLength="4" style={{textAlign: 'center'}}/>
                    </div> */}
                </div>
                <div>
                </div>
                <div className='hidden'></div >
            </div>
        </div>
    )
}