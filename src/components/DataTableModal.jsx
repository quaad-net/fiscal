import { useEffect } from 'react';
import './AuxModal.css'

export default function DataTableModal(props){

    useEffect(()=>{
        const modal = document.querySelector('#data-table-modal');
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
        <div className="modal" id="data-table-modal" style={{display: props.modalOpen ? 'block' : 'none',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
        }}>
            <div className="outer-container">
                <span className="additional-data-table-modal-close" onClick={()=>{props.setModalOpen(false)}}>&times;</span>
                <div className="table-container">
                    <table>
                        <thead>
                        </thead>
                        <tbody>
                            <tr>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}