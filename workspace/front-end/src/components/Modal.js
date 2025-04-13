import React from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button onClick={onClose} className="modal-button cancel">
            Annuler
          </button>
          <button onClick={onConfirm} className="modal-button confirm">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal; 