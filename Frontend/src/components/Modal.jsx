import React, {useState} from 'react'

const Modal = ({ id, icon, titleText, contentText, onSubmit, actionButtonText }) => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        await onSubmit();
        setLoading(false);
    }

    return (
        <dialog id={id} className="modal">
            <div className="modal-box">
               <div className="flex gap-2">
                 {icon || null }
                 <h3 className="font-bold text-lg">{titleText}</h3>
               </div>
                <p className="py-4">{contentText}</p>

                <div className="modal-action">
                    <button className="btn" onClick={() => document.getElementById(id).close()} >Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} >{loading ? 'Loading...' : actionButtonText || "Confirm"}</button>
                </div>
            </div>
        </dialog>
    )
}

export default Modal
