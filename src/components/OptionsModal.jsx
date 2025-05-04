import { useEffect, useState } from 'react';

import './AuxModal.css'
import './OptionsModal.css';

export default function OptionsModal(props){
    const [purchaseHist, setPurchaseHist] = useState([])
    const proxyUrl = import.meta.env.VITE_PROXY_URL; 

    useEffect(()=>{
        const modal = document.querySelector('#options-modal');
        document.addEventListener('click', (e)=>{
            if(e.target == modal){
                props.setModalOpen(false);
            }
        })
        document.removeEventListener('click', (e)=>{
            if(e.target == modal){
                props.setModalOpen(false);
            }
        })

    },[])
    
    function getPurchaseHist(range){
        try{
            fetch(`${proxyUrl}/uwm-fs-expend/range=${range}`
            )
            .then((res)=>{
                console.log(res)
                if(res.status != 200){ throw new Error()}
                return res.json()
            })
            .then((res)=>{
                console.log(res.data)
                setPurchaseHist(res)
                props.setRange(range)
            })
        }
        catch(err){
            console.log(err)
        }
    }

    useEffect(()=>{
        document.addEventListener('keydown', (e)=>{
            if(e.key === 'Escape'){
                props.setModalOpen(false);
            }
        })
        document.removeEventListener('keydown', (e)=>{
            if(e.key === 'Escape'){
                props.setModalOpen(false);
            }
        })
    })

    // function fetch()

    return(
        <div id="options-modal" className="modal" style={{display: props.modalOpen ? 'block' : 'none',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
        }}>
            <div className="options-modal-content">
                <div className="modal-header">
                    <span className="close" onClick={()=>{props.setModalOpen(false)}}>&times;</span>
                    <img alt="options" src= '/icons8-list.svg' width='30px'  className= "modal-icon"/> 
                    <h2 className ="modal-header-text">Range</h2>
                    <div className='modal-subtitle'>selection</div>
                </div>
                <div className="modal-body">
                    <button onClick={()=>{
                        // if(props.range != 30){
                            getPurchaseHist(30)
                        // }
                    }}>30 Day</button>
                    <button>60 Day</button>
                    <button>90 Day</button>
                    <button>Year</button>
                </div>
                <div className="modal-footer">
                    <p></p>
                </div>
            </div>
        </div>
    )
}