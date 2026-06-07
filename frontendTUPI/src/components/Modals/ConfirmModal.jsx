import React from 'react';
import { FiAlertTriangle, FiHelpCircle, FiCheckCircle } from 'react-icons/fi';
import '../AlertsUI/AlertasUI.css';

const ConfirmModal = ({ isOpen, tipo, titulo, mensaje, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (tipo) {
      case 'danger': return <FiAlertTriangle />;
      case 'success': return <FiCheckCircle />;
      default: return <FiHelpCircle />;
    }
  };

  return (
    <div className="modal-overlay-alert">
      <div className="modal-box-alert">
        <div className="modal-alert-header">
          <div className={`modal-alert-icon ${tipo}`}>
            {getIcon()}
          </div>
          <h4>{titulo}</h4>
        </div>
        <div className="modal-alert-body">
          <p>{mensaje}</p>
        </div>
        <div className="modal-alert-actions">
          <button className="btn-alert-cancel" onClick={onCancel}>Cancelar</button>
          <button className={`btn-alert-confirm ${tipo}`} onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;