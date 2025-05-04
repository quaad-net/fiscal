import { useEffect } from 'react';
import './AuxModal.css';

export default function AuxModal(props){

    useEffect(()=>{
        const modal = document.querySelector('#aux-modal');
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

    return(
        <div className="modal" id="aux-modal" style={{display: props.modalOpen ? 'block' : 'none',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
        }}>
            <div className="aux-table-modal-content">
                <div className="aux-table-modal-data">
                    <span className="aux-table-modal-close" onClick={()=>{props.setModalOpen(false)}}>&times;</span>
                    <div className="aux-table-modal-header">
                        Source
                    </div>
                    <div className="aux-table-modal-rows">
                        <div className='aux-table-modal-row'>
                        Monthly Treasury Statement (MTS); https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/outlays-of-the-u-s-government, Feb 4, 2024
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}